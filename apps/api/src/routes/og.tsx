import { app as schemaApp } from "@rcode/schema";
import { Hono } from "hono";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import type { ReactNode } from "react";
import { ImageResponse } from "takumi-js/response";
import { getBackendDb } from "../jazzContext";

const require = createRequire(import.meta.url);
const commitMono400Path = require.resolve("@fontsource/commit-mono/files/commit-mono-latin-400-normal.woff2");
const geistPath = require.resolve("@fontsource-variable/geist/files/geist-latin-wght-normal.woff2");
const commitMono400Data = readFile(commitMono400Path);
const geistData = readFile(geistPath);
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const fallbackTitle = "Untitled room";
const fallbackCreator = "a rcode creator";
const roomTokenPathPattern = /^([a-z0-9]{8})\.png$/;

type ShareKind = "share" | "static";

type RoomOgImageProps = {
  title: string;
  creatorName: string;
  creatorInitial: string;
  creatorAvatarColor: string;
  creatorAvatarSrc: string | null;
  languageShort: string;
};

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trim()}…`;
}

function getDisplayText(value: string | undefined, fallback: string, maxLength: number) {
  const trimmedValue = value?.trim();

  if (trimmedValue === undefined || trimmedValue === "") {
    return fallback;
  }

  return truncateText(trimmedValue, maxLength);
}

function HeaderLine() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, width: "100%" }}>
      <div style={{ height: 2, width: 36, background: "#DDDDDD" }} />
      <div style={{ padding: "0 4px", background: "#E7ABDD", color: "#020202", fontFamily: "CommitMono, monospace", fontSize: 20, lineHeight: "28px" }}>
        RCODE.APP
      </div>
      <div style={{ height: 2, flex: 1, background: "#DDDDDD" }} />
    </div>
  );
}

function TablePreview(props: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", borderBottom: "1px solid #D4D4D4" }}>
        <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 6 }}>
          <div style={{ display: "flex", gap: 2, fontFamily: "CommitMono, monospace", fontSize: 20, lineHeight: "26px", color: "#020202" }}>
            <div>/</div>
            <div>NAME</div>
          </div>
          <div style={{ display: "flex", gap: 2, fontFamily: "CommitMono, monospace", fontSize: 20, lineHeight: "26px", color: "#020202" }}>
            <div>/</div>
            <div>CREATOR</div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>{props.children}</div>
    </div>
  );
}

function LanguageBadge(props: { short: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end", width: 24, height: 24, borderRadius: 2, background: "#007ACB", overflow: "hidden" }}>
      <div style={{ color: "#FFFFFF", fontFamily: "Geist, system-ui, sans-serif", fontSize: 10, lineHeight: "12px", }}>{props.short}</div>
    </div>
  );
}

function CreatorAvatar(props: { color: string; imageSrc: string | null; initial: string; name: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: 2, overflow: "hidden", background: props.color, color: "#000000", fontFamily: "Geist, system-ui, sans-serif", fontSize: 12, lineHeight: "12px" }}>
        {props.imageSrc !== null ? <img src={props.imageSrc} alt={props.name} width={24} height={24} style={{ width: 24, height: 24, objectFit: "cover" }} /> : props.initial}
      </div>
      <div style={{ color: "#000000", fontFamily: "Geist, system-ui, sans-serif", fontSize: 20, lineHeight: "24px", }}>{props.name}</div>
    </div>
  );
}

function RoomRow(props: RoomOgImageProps) {
  return (
    <TablePreview>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <LanguageBadge short={props.languageShort} />
        <div style={{ color: "#000000", fontFamily: "Geist, system-ui, sans-serif", fontSize: 20, lineHeight: "24px", }}>{props.title}</div>
      </div>
      <CreatorAvatar color={props.creatorAvatarColor} imageSrc={props.creatorAvatarSrc} initial={props.creatorInitial} name={props.creatorName} />
    </TablePreview>
  );
}

function RoomOgImage(props: RoomOgImageProps) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 60,
        padding: 64,
        overflow: "hidden",
        color: "#020202",
        backgroundColor: "oklch(92.8% 0 0)",
      }}
    >
      <HeaderLine />

      <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: 60, width: "100%" }}>
        <RoomRow {...props} />
      </div>
    </div>
  );
}

function getInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter((part) => part !== "");
  const firstInitial = parts[0]?.[0] ?? "R";

  return firstInitial.toUpperCase();
}

function getAvatarColor(displayName: string) {
  const value = displayName.trim() === "" ? "rcode" : displayName.trim();
  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) % 360;
  }

  return `oklch(0.74 0.12 ${hash})`;
}

function getLanguageShort(value: string) {
  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === "typescript" || normalizedValue === "tsx") {
    return "TS";
  }

  if (normalizedValue === "javascript") {
    return "JS";
  }

  return normalizedValue.slice(0, 2).toUpperCase();
}

async function getFileDataUrl(avatarFileId: string | undefined) {
  if (avatarFileId === undefined) {
    return null;
  }

  const db = getBackendDb();
  const blob = await db.loadFileAsBlob(schemaApp, avatarFileId, { tier: "edge" });
  const buffer = Buffer.from(await blob.arrayBuffer());

  return `data:${blob.type};base64,${buffer.toString("base64")}`;
}

async function getRoomOgProps(kind: ShareKind, token: string): Promise<RoomOgImageProps | null> {
  const db = getBackendDb();
  const roomQuery = kind === "share" ? schemaApp.rooms.where({ shareToken: token }).limit(1) : schemaApp.rooms.where({ staticToken: token }).limit(1);
  const rooms = await db.all(roomQuery);
  const room = rooms[0];

  if (room === undefined) {
    return null;
  }

  const [metadataRows, profileRows] = await Promise.all([
    db.all(schemaApp.roomMetadata.where({ room_id: room.id }).limit(1)),
    db.all(schemaApp.profiles.where({ session_user_id: room.creator_session_user_id }).limit(1)),
  ]);
  const metadata = metadataRows[0];
  const profile = profileRows[0];
  const editorLanguage = metadata?.editorLanguage ?? "plaintext";
  const creatorName = getDisplayText(profile?.displayName, fallbackCreator, 32);

  return {
    title: getDisplayText(metadata?.title, fallbackTitle, 62),
    creatorName,
    creatorInitial: getInitials(creatorName),
    creatorAvatarColor: getAvatarColor(creatorName),
    creatorAvatarSrc: await getFileDataUrl(profile?.avatarFileId ?? undefined),
    languageShort: getLanguageShort(editorLanguage),
  };
}

async function renderRoomOg(kind: ShareKind, token: string) {
  const props = await getRoomOgProps(kind, token);

  if (props === null) {
    return new Response("Room not found.", { status: 404 });
  }

  return new ImageResponse(<RoomOgImage {...props} />, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    format: "png",
    fonts: [
      {
        name: "CommitMono",
        data: () => commitMono400Data,
        weight: 400,
        style: "normal",
      },
      {
        name: "Geist",
        data: () => geistData,
        weight: 400,
        style: "normal",
      },
    ],
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      "Content-Type": "image/png",
    },
  });
}

function parseRoomTokenPath(value: string) {
  const match = roomTokenPathPattern.exec(value);

  if (match === null) {
    return null;
  }

  return match[1] ?? null;
}

function renderRoomOgFromTokenPath(kind: ShareKind, value: string) {
  const token = parseRoomTokenPath(value);

  if (token === null) {
    return new Response("Invalid room token.", { status: 400 });
  }

  return renderRoomOg(kind, token);
}

export const ogRoutes = new Hono()
  .get("/api/og/share/:shareTokenPath", async (c) => renderRoomOgFromTokenPath("share", c.req.param("shareTokenPath")))
  .get("/api/og/rooms/s/:staticTokenPath", async (c) => renderRoomOgFromTokenPath("static", c.req.param("staticTokenPath")));
