// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title OpenWorksTreasury
 * @notice Fixed-mandate treasury and bounty settlement contract for OpenWorks.
 * Enforces verifiable spending limits, maintainer-authorized payouts, one-time execution,
 * and reserve integrity on-chain.
 */
contract OpenWorksTreasury is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- ENUMS & STRUCTS ---

    enum BountyState {
        None,
        Reserved,
        Paid,
        Cancelled,
        Expired
    }

    struct TicketBounty {
        string ticketId;
        string repoName;
        uint256 amount;
        address reservedBy;
        uint256 reservedAt;
        uint256 expiresAt;
        BountyState state;
        address payee;
        string pullRequestUrl;
    }

    struct MandateConfig {
        string purpose;
        uint256 maxBountyPerTicket;
        uint256 maxSpendPerRound;
        uint256 minUncommittedReserve;
        uint256 mandateExpiry;
    }

    // --- STATE VARIABLES ---

    IERC20 public immutable token;
    address public steward;
    address public championAgent;

    // Mandate Configuration
    string public purpose;
    uint256 public maxBountyPerTicket;
    uint256 public maxSpendPerRound;
    uint256 public minUncommittedReserve;
    uint256 public mandateExpiry;
    uint256 public currentRoundSpend;
    uint256 public totalReserved;
    bool public paused;

    // Default reservation window (e.g., 7 days)
    uint256 public defaultReservationDuration = 7 days;

    // Maintainer Registry: repoId (keccak256(repoName)) => isApproved
    mapping(bytes32 => bool) public approvedRepositories;
    // repoId => maintainerAddress => isApproved
    mapping(bytes32 => mapping(address => bool)) public maintainers;

    // Ticket ID hash => TicketBounty
    mapping(bytes32 => TicketBounty) private tickets;
    // List of ticket hashes for indexing / querying
    bytes32[] public ticketKeys;

    // --- EVENTS ---

    event MandateUpdated(
        string purpose,
        uint256 maxBountyPerTicket,
        uint256 maxSpendPerRound,
        uint256 minUncommittedReserve,
        uint256 mandateExpiry,
        address updatedBy
    );
    event ChampionAgentUpdated(address oldChampion, address newChampion);
    event StewardTransferred(address oldSteward, address newSteward);
    event PauseToggled(bool isPaused, address toggledBy);
    event RoundSpendReset(uint256 previousSpend, address resetBy);
    event DefaultReservationDurationUpdated(uint256 previousDuration, uint256 newDuration, address indexed steward);

    event RepositoryApproved(string repoName, bytes32 indexed repoId);
    event RepositoryRemoved(string repoName, bytes32 indexed repoId);
    event MaintainerAdded(string repoName, bytes32 indexed repoId, address indexed maintainer);
    event MaintainerRemoved(string repoName, bytes32 indexed repoId, address indexed maintainer);

    event BountyReserved(
        string ticketId,
        bytes32 indexed ticketKey,
        string repoName,
        uint256 amount,
        address indexed reservedBy,
        uint256 expiresAt
    );
    event FixAcceptedAndPaid(
        string ticketId,
        bytes32 indexed ticketKey,
        string repoName,
        uint256 amount,
        address indexed payee,
        string pullRequestUrl,
        address indexed confirmedBy
    );
    event BountyCancelled(
        string ticketId,
        bytes32 indexed ticketKey,
        uint256 amount,
        string reason,
        address cancelledBy
    );
    event BountyExpired(
        string ticketId,
        bytes32 indexed ticketKey,
        uint256 amount,
        address releasedBy
    );
    event PayoutBlocked(
        string ticketId,
        bytes32 indexed ticketKey,
        string reason,
        address indexed maintainer
    );

    // --- CUSTOM ERRORS ---

    error ContractPaused();
    error MandateExpired();
    error UnauthorizedCaller();
    error UnauthorizedMaintainer();
    error RepositoryNotApproved();
    error AlreadyReservedOrPaid();
    error TicketNotReserved();
    error ExceedsMaxBounty();
    error ExceedsRoundSpend();
    error ViolatesMinReserve();
    error InsufficientBalance();
    error InvalidPayee();
    error ReservationExpired();
    error ReservationNotExpired();
    error InvalidAmount();
    error InvalidAddress();
    error TicketNotFound();

    // --- MODIFIERS ---

    modifier onlySteward() {
        if (msg.sender != steward) revert UnauthorizedCaller();
        _;
    }

    modifier onlyStewardOrChampion() {
        if (msg.sender != steward && msg.sender != championAgent) {
            revert UnauthorizedCaller();
        }
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    modifier whenMandateActive() {
        if (block.timestamp >= mandateExpiry) revert MandateExpired();
        _;
    }

    // --- CONSTRUCTOR ---

    constructor(
        address _token,
        address _steward,
        address _championAgent,
        string memory _purpose,
        uint256 _maxBountyPerTicket,
        uint256 _maxSpendPerRound,
        uint256 _minUncommittedReserve,
        uint256 _mandateExpiry
    ) {
        if (_token == address(0) || _steward == address(0)) revert InvalidAddress();

        token = IERC20(_token);
        steward = _steward;
        championAgent = _championAgent;

        purpose = _purpose;
        maxBountyPerTicket = _maxBountyPerTicket;
        maxSpendPerRound = _maxSpendPerRound;
        minUncommittedReserve = _minUncommittedReserve;
        mandateExpiry = _mandateExpiry;

        emit MandateUpdated(
            _purpose,
            _maxBountyPerTicket,
            _maxSpendPerRound,
            _minUncommittedReserve,
            _mandateExpiry,
            msg.sender
        );

        if (_championAgent != address(0)) {
            emit ChampionAgentUpdated(address(0), _championAgent);
        }
    }

    // --- STEWARD CONTROLS ---

    function setPaused(bool _paused) external onlySteward {
        paused = _paused;
        emit PauseToggled(_paused, msg.sender);
    }

    function setChampionAgent(address _championAgent) external onlySteward {
        address oldChampion = championAgent;
        championAgent = _championAgent;
        emit ChampionAgentUpdated(oldChampion, _championAgent);
    }

    function transferSteward(address _newSteward) external onlySteward {
        if (_newSteward == address(0)) revert InvalidAddress();
        address oldSteward = steward;
        steward = _newSteward;
        emit StewardTransferred(oldSteward, _newSteward);
    }

    function updateMandate(
        string calldata _purpose,
        uint256 _maxBountyPerTicket,
        uint256 _maxSpendPerRound,
        uint256 _minUncommittedReserve,
        uint256 _mandateExpiry
    ) external onlySteward {
        purpose = _purpose;
        maxBountyPerTicket = _maxBountyPerTicket;
        maxSpendPerRound = _maxSpendPerRound;
        minUncommittedReserve = _minUncommittedReserve;
        mandateExpiry = _mandateExpiry;

        emit MandateUpdated(
            _purpose,
            _maxBountyPerTicket,
            _maxSpendPerRound,
            _minUncommittedReserve,
            _mandateExpiry,
            msg.sender
        );
    }

    function resetRoundSpend() external onlySteward {
        uint256 previousSpend = currentRoundSpend;
        currentRoundSpend = 0;
        emit RoundSpendReset(previousSpend, msg.sender);
    }

    function setDefaultReservationDuration(uint256 duration) external onlySteward {
        uint256 previousDuration = defaultReservationDuration;
        defaultReservationDuration = duration;
        emit DefaultReservationDurationUpdated(previousDuration, duration, msg.sender);
    }

    // --- REPOSITORY & MAINTAINER REGISTRY ---

    function repoKey(string memory repoName) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(repoName));
    }

    function ticketKey(string memory ticketId) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(ticketId));
    }

    function approveRepository(string calldata repoName) external onlySteward {
        bytes32 rKey = repoKey(repoName);
        approvedRepositories[rKey] = true;
        emit RepositoryApproved(repoName, rKey);
    }

    function removeRepository(string calldata repoName) external onlySteward {
        bytes32 rKey = repoKey(repoName);
        approvedRepositories[rKey] = false;
        emit RepositoryRemoved(repoName, rKey);
    }

    function isRepositoryApproved(string calldata repoName) public view returns (bool) {
        return approvedRepositories[repoKey(repoName)];
    }

    function addMaintainer(string calldata repoName, address maintainer) external onlySteward {
        if (maintainer == address(0)) revert InvalidAddress();
        bytes32 rKey = repoKey(repoName);
        maintainers[rKey][maintainer] = true;
        emit MaintainerAdded(repoName, rKey, maintainer);
    }

    function removeMaintainer(string calldata repoName, address maintainer) external onlySteward {
        bytes32 rKey = repoKey(repoName);
        maintainers[rKey][maintainer] = false;
        emit MaintainerRemoved(repoName, rKey, maintainer);
    }

    function isMaintainer(string memory repoName, address maintainer) public view returns (bool) {
        return maintainers[repoKey(repoName)][maintainer];
    }

    // --- TREASURY STATUS HELPERS ---

    function getTreasuryBalance() public view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function getUncommittedBalance() public view returns (uint256) {
        uint256 currentBalance = token.balanceOf(address(this));
        if (currentBalance <= totalReserved) {
            return 0;
        }
        return currentBalance - totalReserved;
    }

    // --- TICKET & BOUNTY RESERVATION ---

    /**
     * @notice Reserve a bounty for a verified eligible ticket.
     * Callable by the Champion Agent or Fund Steward.
     * @param ticketId Unique string identifier of the ticket
     * @param repoName Approved repository name (e.g., "owner/repo")
     * @param amount Bounty amount in tokens
     * @param customDuration Optional custom duration in seconds (0 uses defaultReservationDuration)
     */
    function reserveBounty(
        string calldata ticketId,
        string calldata repoName,
        uint256 amount,
        uint256 customDuration
    ) external onlyStewardOrChampion whenNotPaused whenMandateActive nonReentrant {
        if (amount == 0) revert InvalidAmount();
        if (amount > maxBountyPerTicket) revert ExceedsMaxBounty();

        bytes32 rKey = repoKey(repoName);
        if (!approvedRepositories[rKey]) revert RepositoryNotApproved();

        bytes32 tKey = ticketKey(ticketId);
        TicketBounty storage ticket = tickets[tKey];

        // Ensure ticket is not already reserved or paid
        if (ticket.state == BountyState.Reserved || ticket.state == BountyState.Paid) {
            revert AlreadyReservedOrPaid();
        }

        // Check round spend limit: committed pending reservations plus already paid spend plus proposed amount
        if (currentRoundSpend + totalReserved + amount > maxSpendPerRound) {
            revert ExceedsRoundSpend();
        }

        // Check reserve integrity: Treasury must hold enough tokens above minUncommittedReserve
        uint256 treasuryBalance = token.balanceOf(address(this));
        if (treasuryBalance < totalReserved + amount) {
            revert InsufficientBalance();
        }
        if (treasuryBalance - (totalReserved + amount) < minUncommittedReserve) {
            revert ViolatesMinReserve();
        }

        uint256 duration = customDuration > 0 ? customDuration : defaultReservationDuration;
        uint256 expiresAt = block.timestamp + duration;
        if (expiresAt > mandateExpiry) {
            expiresAt = mandateExpiry;
        }

        // Commit reservation
        totalReserved += amount;

        if (ticket.state == BountyState.None) {
            ticketKeys.push(tKey);
        }

        ticket.ticketId = ticketId;
        ticket.repoName = repoName;
        ticket.amount = amount;
        ticket.reservedBy = msg.sender;
        ticket.reservedAt = block.timestamp;
        ticket.expiresAt = expiresAt;
        ticket.state = BountyState.Reserved;
        ticket.payee = address(0);
        ticket.pullRequestUrl = "";

        emit BountyReserved(ticketId, tKey, repoName, amount, msg.sender, expiresAt);
    }

    // --- ACCEPTANCE & PAYOUT ---

    /**
     * @notice Confirm accepted fix and trigger one-time payout to the contributor.
     * Only permitted maintainer of the target repository can execute this.
     * @param ticketId Unique string identifier of the ticket
     * @param pullRequestUrl PR URL or commit hash proving the accepted contribution
     * @param payee Address of the contributor receiving the bounty
     */
    function confirmFixAndPayout(
        string calldata ticketId,
        string calldata pullRequestUrl,
        address payee
    ) external whenNotPaused whenMandateActive nonReentrant {
        if (payee == address(0)) revert InvalidPayee();

        bytes32 tKey = ticketKey(ticketId);
        TicketBounty storage ticket = tickets[tKey];

        if (ticket.state == BountyState.None) {
            revert TicketNotFound();
        }
        if (ticket.state == BountyState.Paid) {
            revert AlreadyReservedOrPaid();
        }
        if (ticket.state != BountyState.Reserved) {
            revert TicketNotReserved();
        }

        // Check reservation expiry
        if (block.timestamp > ticket.expiresAt) {
            emit PayoutBlocked(ticketId, tKey, "ReservationExpired", msg.sender);
            revert ReservationExpired();
        }

        // Check maintainer authorization
        bytes32 rKey = repoKey(ticket.repoName);
        if (!maintainers[rKey][msg.sender]) {
            emit PayoutBlocked(ticketId, tKey, "UnauthorizedMaintainer", msg.sender);
            revert UnauthorizedMaintainer();
        }

        uint256 payoutAmount = ticket.amount;

        // Transition state to Paid
        ticket.state = BountyState.Paid;
        ticket.payee = payee;
        ticket.pullRequestUrl = pullRequestUrl;

        // Accounting updates
        totalReserved -= payoutAmount;
        currentRoundSpend += payoutAmount;

        // Safe transfer tokens to contributor
        token.safeTransfer(payee, payoutAmount);

        emit FixAcceptedAndPaid(
            ticketId,
            tKey,
            ticket.repoName,
            payoutAmount,
            payee,
            pullRequestUrl,
            msg.sender
        );
    }

    // --- EXPIRY & CANCELLATION RELEASE ---

    /**
     * @notice Release reserved funds if reservation window expired without maintainer payout.
     * Anyone can trigger this to free uncommitted funds for future bounties.
     * @param ticketId Unique string identifier of the ticket
     */
    function releaseExpiredReservation(string calldata ticketId) external nonReentrant {
        bytes32 tKey = ticketKey(ticketId);
        TicketBounty storage ticket = tickets[tKey];

        if (ticket.state != BountyState.Reserved) {
            revert TicketNotReserved();
        }
        if (block.timestamp <= ticket.expiresAt) {
            revert ReservationNotExpired();
        }

        uint256 releasedAmount = ticket.amount;
        ticket.state = BountyState.Expired;
        totalReserved -= releasedAmount;

        emit BountyExpired(ticketId, tKey, releasedAmount, msg.sender);
    }

    /**
     * @notice Cancel a reserved bounty (e.g. if fix abandoned or rejected by steward).
     * Only callable by Fund Steward.
     * @param ticketId Unique string identifier of the ticket
     * @param reason Explanation for cancellation
     */
    function cancelReservation(
        string calldata ticketId,
        string calldata reason
    ) external onlySteward nonReentrant {
        bytes32 tKey = ticketKey(ticketId);
        TicketBounty storage ticket = tickets[tKey];

        if (ticket.state != BountyState.Reserved) {
            revert TicketNotReserved();
        }

        uint256 releasedAmount = ticket.amount;
        ticket.state = BountyState.Cancelled;
        totalReserved -= releasedAmount;

        emit BountyCancelled(ticketId, tKey, releasedAmount, reason, msg.sender);
    }

    // --- VIEW GETTERS ---

    function getTicket(string calldata ticketId) external view returns (TicketBounty memory) {
        bytes32 tKey = ticketKey(ticketId);
        if (tickets[tKey].state == BountyState.None) revert TicketNotFound();
        return tickets[tKey];
    }

    function getTicketByKey(bytes32 tKey) external view returns (TicketBounty memory) {
        if (tickets[tKey].state == BountyState.None) revert TicketNotFound();
        return tickets[tKey];
    }

    function getTicketCount() external view returns (uint256) {
        return ticketKeys.length;
    }
}
