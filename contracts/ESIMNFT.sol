// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ESIMNFT is ERC721, ERC721Enumerable, Ownable, EIP712 {
    using Strings for uint256;

    struct ESIMPlan {
        string provider;       // eSIM provider name (e.g., "Airalo")
        string planId;         // Provider's plan identifier
        string country;        // Country name
        string countryCode;    // ISO 3166-1 alpha-2 country code
        uint256 dataBytes;     // Data amount in bytes
        uint256 validityDays;  // Validity period in days
        bool activated;        // Whether the eSIM has been activated
        address activatedBy;   // Who activated it
        uint256 activatedAt;   // When it was activated
    }

    /// @dev For gas efficiency, store activation info separately from plan metadata
    struct ActivationInfo {
        bool activated;
        address activatedBy;
        uint256 activatedAt;
    }

    uint256 private _nextTokenId;
    string private _baseTokenURI;

    // Core plan data per token
    mapping(uint256 => string) private _tokenProvider;
    mapping(uint256 => string) private _tokenPlanId;
    mapping(uint256 => string) private _tokenCountry;
    mapping(uint256 => string) private _tokenCountryCode;
    mapping(uint256 => uint256) private _tokenDataBytes;
    mapping(uint256 => uint256) private _tokenValidityDays;
    mapping(uint256 => ActivationInfo) private _tokenActivation;

    // Operator role for gasless activation
    mapping(address => bool) private _operators;

    // Track burned tokens
    uint256[] private _burnedTokens;

    event PlanMinted(uint256 indexed tokenId, string provider, string planId, string country, string countryCode);
    event PlanActivated(uint256 indexed tokenId, address indexed activator);
    event OperatorSet(address indexed operator, bool indexed enabled);
    event BaseURIUpdated(string uri);

    error NotTokenOwner();
    error AlreadyActivated();
    error TokenDoesNotExist();
    error NotOperator();
    error CannotTransferActivated();

    modifier onlyOperator() {
        if (!_operators[msg.sender] && msg.sender != owner()) {
            revert NotOperator();
        }
        _;
    }

    constructor(string memory baseURI)
        ERC721("Transferable eSIM Voucher", "eSIM")
        Ownable(msg.sender)
        EIP712("ESIMNFT", "1")
    {
        _baseTokenURI = baseURI;
    }

    function mint(
        address to,
        string calldata provider,
        string calldata planId,
        string calldata country,
        string calldata countryCode,
        uint256 dataBytes,
        uint256 validityDays
    ) external onlyOwner returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _tokenProvider[tokenId] = provider;
        _tokenPlanId[tokenId] = planId;
        _tokenCountry[tokenId] = country;
        _tokenCountryCode[tokenId] = countryCode;
        _tokenDataBytes[tokenId] = dataBytes;
        _tokenValidityDays[tokenId] = validityDays;

        emit PlanMinted(tokenId, provider, planId, country, countryCode);
    }

    /// @notice Activate an eSIM NFT (marks it as used, making it non-transferable)
    function activate(uint256 tokenId) external {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        if (_tokenActivation[tokenId].activated) revert AlreadyActivated();

        _tokenActivation[tokenId] = ActivationInfo({
            activated: true,
            activatedBy: msg.sender,
            activatedAt: block.timestamp
        });

        emit PlanActivated(tokenId, msg.sender);
    }

    /// @notice Operator can activate on behalf of the owner (useful for gasless UX)
    function operatorActivate(uint256 tokenId, address activator) external onlyOperator {
        if (ownerOf(tokenId) != activator) revert NotTokenOwner();
        if (_tokenActivation[tokenId].activated) revert AlreadyActivated();

        _tokenActivation[tokenId] = ActivationInfo({
            activated: true,
            activatedBy: activator,
            activatedAt: block.timestamp
        });

        emit PlanActivated(tokenId, activator);
    }

    function setOperator(address operator, bool enabled) external onlyOwner {
        _operators[operator] = enabled;
        emit OperatorSet(operator, enabled);
    }

    function isOperator(address addr) external view returns (bool) {
        return _operators[addr];
    }

    function burn(uint256 tokenId) external {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        _burn(tokenId);
        _burnedTokens.push(tokenId);
    }

    function getPlan(uint256 tokenId) external view returns (ESIMPlan memory) {
        if (!_exists(tokenId)) revert TokenDoesNotExist();
        ActivationInfo memory act = _tokenActivation[tokenId];
        return ESIMPlan({
            provider: _tokenProvider[tokenId],
            planId: _tokenPlanId[tokenId],
            country: _tokenCountry[tokenId],
            countryCode: _tokenCountryCode[tokenId],
            dataBytes: _tokenDataBytes[tokenId],
            validityDays: _tokenValidityDays[tokenId],
            activated: act.activated,
            activatedBy: act.activatedBy,
            activatedAt: act.activatedAt
        });
    }

    function isActivated(uint256 tokenId) external view returns (bool) {
        if (!_exists(tokenId)) revert TokenDoesNotExist();
        return _tokenActivation[tokenId].activated;
    }

    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    function getBurnedTokens() external view returns (uint256[] memory) {
        return _burnedTokens;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!_exists(tokenId)) revert TokenDoesNotExist();
        return string.concat(_baseTokenURI, tokenId.toString());
    }

    function setBaseURI(string calldata baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
        emit BaseURIUpdated(baseURI);
    }

    // ---- ERC-5192 style: block transfer of activated tokens ----
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        // Allow minting (from is address(0)) and burning (to is address(0))
        // Block transfers of activated tokens
        if (to != address(0) && _tokenActivation[tokenId].activated) {
            revert CannotTransferActivated();
        }
        return super._update(to, tokenId, auth);
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // ---- Required overrides for OpenZeppelin v5 diamond inheritance ----
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    // ---- EIP-712 typed data for off-chain activation approvals ----
    struct ActivatePermit {
        uint256 tokenId;
        address activator;
        uint256 deadline;
    }

    bytes32 private constant _ACTIVATE_PERMIT_TYPEHASH =
        keccak256("ActivatePermit(uint256 tokenId,address activator,uint256 deadline)");

    function activateWithPermit(
        uint256 tokenId,
        address activator,
        uint256 deadline,
        bytes calldata signature
    ) external {
        if (block.timestamp > deadline) revert("Permit expired");
        if (_tokenActivation[tokenId].activated) revert AlreadyActivated();

        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(
                _ACTIVATE_PERMIT_TYPEHASH,
                tokenId,
                activator,
                deadline
            ))
        );

        address signer = ECDSA.recover(digest, signature);
        if (ownerOf(tokenId) != signer) revert NotTokenOwner();

        _tokenActivation[tokenId] = ActivationInfo({
            activated: true,
            activatedBy: activator,
            activatedAt: block.timestamp
        });

        emit PlanActivated(tokenId, activator);
    }

    function getActivatePermitHash(
        uint256 tokenId,
        address activator,
        uint256 deadline
    ) external view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(abi.encode(
                _ACTIVATE_PERMIT_TYPEHASH,
                tokenId,
                activator,
                deadline
            ))
        );
    }
}
