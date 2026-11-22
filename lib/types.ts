/*
  What FixMyStreet SA stores in Firestore.

  reports/{reportId}   one problem someone reported: what it is, where it is (a point on the map), how many
                       people have said "I see this too", and where the municipality has got to with it.
                       Anyone can read it (that's what the map and the share link show). Whoever reported it
                       can delete it while nobody has looked at it. Only council staff can change its status.
  votes/{reportId}_{uid}   one person's "I see this too" on one report. Only that person can read or remove it.
                       The vote and the report's count move together, in one step (firestore.rules).
  staff/{uid}          exists only for council staff, and is added by hand in the Firebase console. The
                       rules read it to decide who may change a status.

  A demo report (demo: true) belongs to the person trying the demo and is invisible to everyone else, so
  made-up reports never reach the real map.
*/

export type Category = "pothole" | "streetlight" | "water" | "sewage" | "refuse" | "signal" | "sign" | "other";
export type Status = "reported" | "acknowledged" | "fixed";

export type Report = {
  id: string;
  ownerId: string;
  number: string; // "FMS-4K7Q", the reference people quote
  title: string; // "Deep pothole outside the taxi rank"
  category: Category;
  description: string;
  area: string; // a suburb or street, as typed
  lat: number;
  lng: number;
  status: Status;
  statusNote: string; // the council's note, shown on the report
  votes: number; // people who see it too, including the person who reported it
  demo: boolean;
  createdAt: number;
  updatedAt: number;
  fixedAt: number; // 0 until it's fixed
};

/** What the report form hands over before it's saved */
export type ReportInput = {
  title: string;
  category: Category | "";
  description: string;
  area: string;
  lat: number | null;
  lng: number | null;
};
