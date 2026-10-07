import { db } from "./firebase";
import {
  ref,
  push,
  set,
  update,
  remove,
  onValue,
  off,
  serverTimestamp,
  DataSnapshot
} from "firebase/database";

export type RecordMap = Record<string, any>;

export function subscribe(path: string, callback: (data: RecordMap) => void) {
  const r = ref(db, path);
  const handler = (snap: DataSnapshot) => callback((snap.val() || {}) as RecordMap);
  onValue(r, handler);
  return () => off(r, "value", handler);
}

export async function createRecord(path: string, data: RecordMap) {
  const r = push(ref(db, path));
  await set(r, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return r.key!;
}

export async function updateRecord(path: string, id: string, data: RecordMap) {
  await update(ref(db, `${path}/${id}`), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteRecord(path: string, id: string) {
  await remove(ref(db, `${path}/${id}`));
}
