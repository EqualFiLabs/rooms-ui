import { parseAbi } from "viem";

/** Read/event surface checked against Rooms revision 5ff074706eca741461d63eeb209fe523d616aa59. */
export const ownershipAbi = parseAbi([
  "event TicketsPurchased(uint256 indexed roundId, address indexed buyer, uint8 indexed room, uint256 quantity, uint8 epoch, uint256 unitPrice, uint256 payment, uint256 ticketsRemaining)",
  "function userRoomTicketCount(uint256 id, uint8 room, address user) view returns (uint256)",
  "function prizeClaimed(uint256 id, address user) view returns (bool)",
  "function claimablePrize(uint256 id, address user) view returns (uint256)",
  "event PrizeClaimed(uint256 indexed roundId, address indexed player, address indexed receiver, uint256 tickets, uint256 amount)",
]);
