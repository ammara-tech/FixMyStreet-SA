import type { Category, Status } from "@/lib/types";

/* The example reports a demo guest starts with (lib/demo.ts). Places are real suburbs around Johannesburg, the problems are made up. */

export type Example = { title: string; category: Category; area: string; lat: number; lng: number; status: Status; votes: number; daysAgo: number; fixedAfter?: number; note?: string; description: string };

export const EXAMPLES: Example[] = [
  { title: "Deep pothole in the left lane", category: "pothole", area: "Braamfontein", lat: -26.1929, lng: 28.0326, status: "reported", votes: 23, daysAgo: 6, description: "Cars swerve into the next lane to avoid it. Gets worse after every storm." },
  { title: "Three streetlights out on the walkway to the station", category: "streetlight", area: "Newtown", lat: -26.2036, lng: 28.0345, status: "reported", votes: 31, daysAgo: 12, description: "Very dark after 6pm. People walk in the road because they can't see the pavement." },
  { title: "Water gushing from a burst pipe", category: "water", area: "Orlando West", lat: -26.2386, lng: 27.9071, status: "acknowledged", votes: 58, daysAgo: 5, note: "Logged with the water department. A crew is booked for Thursday.", description: "Running since Monday morning. The whole street is wet and the pressure is gone." },
  { title: "Manhole overflowing into the street", category: "sewage", area: "Alexandra", lat: -26.1048, lng: 28.0985, status: "reported", votes: 44, daysAgo: 9, description: "Sewage runs past the school gate every morning. The smell is terrible." },
  { title: "Rubbish dumped on the open lot", category: "refuse", area: "Yeoville", lat: -26.1857, lng: 28.0652, status: "reported", votes: 17, daysAgo: 15, description: "Started with one bag. Now it's a mattress, tyres and building rubble." },
  { title: "Robot out at the main intersection", category: "signal", area: "Melville", lat: -26.1762, lng: 28.0089, status: "acknowledged", votes: 39, daysAgo: 3, note: "A technician has been sent to check the controller.", description: "All four directions are dark. Drivers are treating it as a four-way stop, and some don't." },
  { title: "Stop sign knocked over", category: "sign", area: "Parktown", lat: -26.1802, lng: 28.0396, status: "reported", votes: 9, daysAgo: 2, description: "Lying on the verge since the weekend. Drivers now go straight through." },
  { title: "Pothole outside the taxi rank", category: "pothole", area: "Maboneng", lat: -26.2052, lng: 28.0581, status: "fixed", votes: 27, daysAgo: 20, fixedAfter: 8, note: "Patched on Tuesday.", description: "Taxis queue over it and it has damaged a few tyres." },
  { title: "Streetlight flickering all night", category: "streetlight", area: "Rosebank", lat: -26.1459, lng: 28.0427, status: "fixed", votes: 12, daysAgo: 18, fixedAfter: 5, note: "Lamp replaced.", description: "Flashes on and off. Makes the whole corner feel unsafe." },
  { title: "Burst pipe flooding the corner", category: "water", area: "Dobsonville", lat: -26.2149, lng: 27.8481, status: "fixed", votes: 36, daysAgo: 25, fixedAfter: 3, note: "Pipe replaced and the road reopened.", description: "Water has been pouring down the road for days." },
  { title: "Sinkhole forming beside the pavement", category: "pothole", area: "Jabavu", lat: -26.2477, lng: 27.8716, status: "reported", votes: 52, daysAgo: 4, description: "The edge of the road is collapsing. Children walk right past it to get to school." },
  { title: "Refuse not collected for two weeks", category: "refuse", area: "Diepkloof", lat: -26.262, lng: 27.956, status: "reported", votes: 21, daysAgo: 14, description: "Bins are overflowing and dogs are tearing the bags open." },
];

