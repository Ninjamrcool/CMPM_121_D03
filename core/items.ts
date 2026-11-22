const mandibleItem: ItemType = { id: "mandible", name: "Mandible" };
const craniumItem: ItemType = { id: "cranium", name: "Cranium" };
const ligamentItem: ItemType = { id: "ligament", name: "Ligament" };
const spinalCordItem: ItemType = { id: "spinal_cord", name: "Spinal Cord" };
const ribItem: ItemType = { id: "rib", name: "Rib" };
const toeItem: ItemType = { id: "toe", name: "Toe" };
const femurItem: ItemType = { id: "femur", name: "Femur" };
const tibiaItem: ItemType = { id: "tibia", name: "Tibia" };
const vertebraeItem: ItemType = { id: "vertebrae", name: "Vertebrae" };
const headItem: ItemType = { id: "head", name: "Head" };
const neckItem: ItemType = { id: "neck", name: "Neck" };
const ribcageItem: ItemType = { id: "ribcage", name: "Ribcage" };
const legItem: ItemType = { id: "leg", name: "Leg" };
const tailItem: ItemType = { id: "tail", name: "Tail" };
const dinosaurItem: ItemType = { id: "dinosaur", name: "Dinosaur" };
const boneLadderItem: ItemType = { id: "bone_ladder", name: "Bone Ladder" };

export const items = {
  mandible: mandibleItem,
  cranium: craniumItem,
  ligament: ligamentItem,
  spinalCord: spinalCordItem,
  rib: ribItem,
  toe: toeItem,
  femur: femurItem,
  tibia: tibiaItem,
  vertebrae: vertebraeItem,
  head: headItem,
  neck: neckItem,
  ribcage: ribcageItem,
  leg: legItem,
  tail: tailItem,
  dinosaur: dinosaurItem,
  boneLadder: boneLadderItem,
};

export interface ItemType {
  id: string;
  name: string;
}

export interface ItemStack {
  type: ItemType;
  stackSize: number;
}
