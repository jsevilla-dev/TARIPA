import { useState, useEffect, useMemo } from "react";
import {
  IconBolt,
  IconDroplet,
  IconBed,
  IconSearch,
  IconEdit,
  IconTrash,
  IconLayersSubtract,
  IconAlertTriangle,
  IconMaximize,
  IconMinimize,
  IconSparkles,
  IconPhone,
  IconCalendar,
} from "@tabler/icons-react";

const formatPHP = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

/**
 * Isometric Math Helper
 * Converts 3D grid coordinates (x, y, z) into 2D SVG screen coordinates (sx, sy)
 */
const iso = (x, y, z = 0, originX = 430, originY = 215) => {
  const sx = originX + (x - y) * 0.866025;
  const sy = originY + (x + y) * 0.5 - z;
  return { x: Number(sx.toFixed(1)), y: Number(sy.toFixed(1)) };
};

const pt = (p) => `${p.x},${p.y}`;
const poly = (...pts) => pts.map(pt).join(" ");

/**
 * Draws a 3D extruded isometric box given (x, y, z) and dimensions (dx, dy, dz)
 */
function IsoBox({
  x,
  y,
  z = 0,
  dx,
  dy,
  dz,
  topColor = "#F8FAFC",
  leftColor = "#CBD5E1",
  rightColor = "#E2E8F0",
  stroke = "rgba(15,23,42,0.14)",
  strokeWidth = 0.8,
  opacity = 1,
  originX = 430,
  originY = 215,
}) {
  const b00 = iso(x, y, z, originX, originY);
  const b10 = iso(x + dx, y, z, originX, originY);
  const b11 = iso(x + dx, y + dy, z, originX, originY);
  const b01 = iso(x, y + dy, z, originX, originY);

  const t00 = iso(x, y, z + dz, originX, originY);
  const t10 = iso(x + dx, y, z + dz, originX, originY);
  const t11 = iso(x + dx, y + dy, z + dz, originX, originY);
  const t01 = iso(x, y + dy, z + dz, originX, originY);

  return (
    <g opacity={opacity} style={{ transition: "all 0.35s cubic-bezier(0.22, 1, 0.36, 1)" }}>
      {/* Left visible face (facing +y) */}
      <polygon
        points={poly(b01, b11, t11, t01)}
        fill={leftColor}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {/* Right visible face (facing +x) */}
      <polygon
        points={poly(b10, b11, t11, t10)}
        fill={rightColor}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {/* Top face */}
      <polygon
        points={poly(t00, t10, t11, t01)}
        fill={topColor}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </g>
  );
}

/**
 * Draws an Isometric 3D Room Cutaway inside the unified Apartment Building
 * Includes: Tiled floor, interior walls, AC unit, wardrobe cabinet, 3D beds with pillows,
 * front hallway doorway, digital sub-meter box with pulsing LED, and floating callout badge.
 */
function IsoRoomUnit({
  room,
  rx,
  ry,
  rz = 0,
  W = 114,
  D = 96,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  showPower,
  showWater,
  showRoof,
  roomStats,
  originX = 430,
  originY = 215,
}) {
  const H = 52; // Wall height
  const wallT = 6;

  const liftZ = isSelected ? 10 : isHovered ? 5 : 0;
  const z = rz + liftZ;

  const occupied = Number(room.occupied_count || 0);
  const capacity = Math.max(1, Number(room.capacity || 4));
  const isFull = occupied >= capacity;
  const hasUnpaid = roomStats?.unpaidCount > 0;

  // Rich cobalt & architectural palette inspired by the viral 3D building dashboard
  const palette = isSelected
    ? {
        floor: "#DBEAFE",
        floorGrid: "#93C5FD",
        wallTop: "#60A5FA",
        wallLeft: "#1D4ED8",
        wallRight: "#2563EB",
        wallInnerLeft: "#93C5FD",
        wallInnerBack: "#BFDBFE",
        stroke: "#1E3A8A",
      }
    : hasUnpaid
    ? {
        floor: "#FEF3C7",
        floorGrid: "#FDE68A",
        wallTop: "#FCD34D",
        wallLeft: "#D97706",
        wallRight: "#F59E0B",
        wallInnerLeft: "#FDE68A",
        wallInnerBack: "#FEF3C7",
        stroke: "#B45309",
      }
    : isFull
    ? {
        floor: "#EFF6FF",
        floorGrid: "#BFDBFE",
        wallTop: "#93C5FD",
        wallLeft: "#1E40AF",
        wallRight: "#3B82F6",
        wallInnerLeft: "#BFDBFE",
        wallInnerBack: "#DBEAFE",
        stroke: "#1E3A8A",
      }
    : {
        floor: "#F8FAFC",
        floorGrid: "#E2E8F0",
        wallTop: "#FFFFFF",
        wallLeft: "#64748B",
        wallRight: "#94A3B8",
        wallInnerLeft: "#CBD5E1",
        wallInnerBack: "#E2E8F0",
        stroke: "#475569",
      };

  const s00 = iso(rx, ry, rz + 1, originX, originY);
  const s10 = iso(rx + W, ry, rz + 1, originX, originY);
  const s11 = iso(rx + W, ry + D, rz + 1, originX, originY);
  const s01 = iso(rx, ry + D, rz + 1, originX, originY);

  const centerTop = iso(rx + W / 2, ry + D / 2, z + H + 26, originX, originY);
  const centerFloor = iso(rx + W / 2, ry + D / 2, z + 6, originX, originY);

  // Calculate bed positions inside the room
  const visibleBeds = Math.min(capacity, 6);
  const beds = [];
  for (let i = 0; i < visibleBeds; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const bx = rx + 14 + col * 42;
    const by = ry + 14 + row * 24;
    const isBedOccupied = i < occupied;
    beds.push({ bx, by, isBedOccupied, id: i });
  }

  // Sub-meter position on the front exterior wall
  const meterPos = iso(rx + 26, ry + D + 3, z + 24, originX, originY);

  return (
    <g
      onClick={(e) => {
        e.stopPropagation();
        onSelect(room);
      }}
      onMouseEnter={() => onHover(room.id)}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: "pointer" }}
    >
      {/* Room Drop Shadow on Building Slab */}
      <polygon
        points={poly(s00, s10, s11, s01)}
        fill={isSelected ? "rgba(37, 99, 235, 0.32)" : "rgba(15, 23, 42, 0.15)"}
        style={{ transition: "all 0.35s ease" }}
      />

      {/* 1. Room Floor Slab */}
      <IsoBox
        x={rx}
        y={ry}
        z={z}
        dx={W}
        dy={D}
        dz={6}
        topColor={palette.floor}
        leftColor={palette.wallLeft}
        rightColor={palette.wallRight}
        stroke={palette.stroke}
        strokeWidth={1}
        originX={originX}
        originY={originY}
      />

      {/* Interior Tiled Floor Grid */}
      {[0.25, 0.5, 0.75].map((frac, idx) => {
        const p1 = iso(rx + W * frac, ry + wallT, z + 6, originX, originY);
        const p2 = iso(rx + W * frac, ry + D - wallT, z + 6, originX, originY);
        const q1 = iso(rx + wallT, ry + D * frac, z + 6, originX, originY);
        const q2 = iso(rx + W - wallT, ry + D * frac, z + 6, originX, originY);
        return (
          <g key={idx} opacity={0.65}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={palette.floorGrid} strokeWidth="0.8" />
            <line x1={q1.x} y1={q1.y} x2={q2.x} y2={q2.y} stroke={palette.floorGrid} strokeWidth="0.8" />
          </g>
        );
      })}

      {/* 2. Rear Exterior Wall (along Y=ry) */}
      <IsoBox
        x={rx}
        y={ry}
        z={z + 6}
        dx={W}
        dy={wallT}
        dz={H}
        topColor={palette.wallTop}
        leftColor={palette.wallInnerBack}
        rightColor={palette.wallRight}
        stroke={palette.stroke}
        originX={originX}
        originY={originY}
      />

      {/* Wall-Mounted Split-Type AC Unit inside Rear Wall */}
      <IsoBox
        x={rx + W * 0.35}
        y={ry + wallT}
        z={z + H - 8}
        dx={34}
        dy={6}
        dz={9}
        topColor="#FFFFFF"
        leftColor="#E2E8F0"
        rightColor="#CBD5E1"
        stroke="#64748B"
        strokeWidth={0.6}
        originX={originX}
        originY={originY}
      />

      {/* 3. Left Partition Wall (along X=rx) */}
      <IsoBox
        x={rx}
        y={ry}
        z={z + 6}
        dx={wallT}
        dy={D}
        dz={H}
        topColor={palette.wallTop}
        leftColor={palette.wallLeft}
        rightColor={palette.wallInnerLeft}
        stroke={palette.stroke}
        originX={originX}
        originY={originY}
      />

      {/* Interior Wardrobe / Locker Cabinet in Back-Right Corner */}
      <IsoBox
        x={rx + W - 22}
        y={ry + 10}
        z={z + 6}
        dx={14}
        dy={22}
        dz={32}
        topColor="#F1F5F9"
        leftColor="#94A3B8"
        rightColor="#CBD5E1"
        stroke="#475569"
        strokeWidth={0.7}
        originX={originX}
        originY={originY}
      />

      {/* 4. Interior 3D Beds (Lit Cobalt Blue = Occupied, Crisp White = Vacant) */}
      {beds.map((b) => (
        <g key={b.id}>
          {/* Bed Base */}
          <IsoBox
            x={b.bx}
            y={b.by}
            z={z + 6}
            dx={32}
            dy={17}
            dz={8}
            topColor={b.isBedOccupied ? "#3B82F6" : "#FFFFFF"}
            leftColor={b.isBedOccupied ? "#1D4ED8" : "#CBD5E1"}
            rightColor={b.isBedOccupied ? "#2563EB" : "#E2E8F0"}
            stroke={b.isBedOccupied ? "#1E3A8A" : "#94A3B8"}
            strokeWidth={0.75}
            originX={originX}
            originY={originY}
          />
          {/* Blanket Fold Accent */}
          {b.isBedOccupied && (
            <IsoBox
              x={b.bx + 12}
              y={b.by + 0.5}
              z={z + 14}
              dx={19}
              dy={16}
              dz={1.2}
              topColor="#60A5FA"
              leftColor="#2563EB"
              rightColor="#3B82F6"
              stroke="none"
              originX={originX}
              originY={originY}
            />
          )}
          {/* Pillow */}
          <IsoBox
            x={b.bx + 2}
            y={b.by + 2.5}
            z={z + 14}
            dx={7.5}
            dy={12}
            dz={2.5}
            topColor="#FFFFFF"
            leftColor="#E2E8F0"
            rightColor="#F8FAFC"
            stroke="#94A3B8"
            strokeWidth={0.5}
            originX={originX}
            originY={originY}
          />
        </g>
      ))}

      {/* 5. Right Cutaway Partition Wall */}
      <IsoBox
        x={rx + W - wallT}
        y={ry}
        z={z + 6}
        dx={wallT}
        dy={D}
        dz={20}
        topColor={palette.wallTop}
        leftColor={palette.wallLeft}
        rightColor={palette.wallRight}
        stroke={palette.stroke}
        originX={originX}
        originY={originY}
      />

      {/* 6. Front Hallway Wall with Doorway Cutout & Window */}
      <IsoBox
        x={rx}
        y={ry + D - wallT}
        z={z + 6}
        dx={W * 0.62}
        dy={wallT}
        dz={30}
        topColor={palette.wallTop}
        leftColor={palette.wallLeft}
        rightColor={palette.wallRight}
        stroke={palette.stroke}
        originX={originX}
        originY={originY}
      />
      {/* Welcome Door Mat at Room Entrance */}
      <IsoBox
        x={rx + W * 0.65}
        y={ry + D - 10}
        z={z + 6}
        dx={24}
        dy={10}
        dz={1.2}
        topColor={isSelected ? "#2563EB" : "#334155"}
        leftColor="#0F172A"
        rightColor="#1E293B"
        stroke="none"
        originX={originX}
        originY={originY}
      />

      {/* Wall-Mounted Smart Sub-Meter Box on Front Wall */}
      <IsoBox
        x={rx + 18}
        y={ry + D}
        z={z + 15}
        dx={16}
        dy={4}
        dz={14}
        topColor="#F8FAFC"
        leftColor="#0F172A"
        rightColor="#1E293B"
        stroke="#334155"
        strokeWidth={0.7}
        originX={originX}
        originY={originY}
      />
      {/* Sub-Meter Glowing LED */}
      <circle
        cx={meterPos.x}
        cy={meterPos.y}
        r={3.2}
        fill={occupied > 0 ? "#10B981" : "#94A3B8"}
        stroke="#FFFFFF"
        strokeWidth="0.9"
      />
      {(showPower || showWater) && occupied > 0 && (
        <circle
          cx={meterPos.x}
          cy={meterPos.y}
          r={6.5}
          fill="none"
          stroke={showPower ? "#3B82F6" : "#06B6D4"}
          strokeWidth="1.3"
          opacity="0.75"
          className="iso-pulse-ring"
        />
      )}

      {/* Optional Architectural Roof Overhang when Roof Mode is toggled on */}
      {showRoof && (
        <g>
          <IsoBox
            x={rx - 2}
            y={ry - 4}
            z={z + H + 6}
            dx={W + 4}
            dy={D + 16}
            dz={7}
            topColor="#2563EB"
            leftColor="#1E3A8A"
            rightColor="#1D4ED8"
            stroke="#172554"
            opacity={0.78}
            originX={originX}
            originY={originY}
          />
          {/* Solar Panel Array on Roof */}
          <IsoBox
            x={rx + 16}
            y={ry + 14}
            z={z + H + 13}
            dx={W - 32}
            dy={D - 32}
            dz={2}
            topColor="#0F172A"
            leftColor="#1E293B"
            rightColor="#334155"
            stroke="#38BDF8"
            strokeWidth={0.8}
            opacity={0.85}
            originX={originX}
            originY={originY}
          />
        </g>
      )}

      {/* Selection Spotlight Beam */}
      {isSelected && (
        <g pointerEvents="none">
          <line
            x1={centerFloor.x}
            y1={centerFloor.y}
            x2={centerTop.x}
            y2={centerTop.y - 10}
            stroke="#2563EB"
            strokeWidth="2.2"
            strokeDasharray="4 4"
          />
          <ellipse
            cx={centerFloor.x}
            cy={centerFloor.y}
            rx="24"
            ry="13"
            fill="rgba(37, 99, 235, 0.22)"
            stroke="#2563EB"
            strokeWidth="1.5"
          />
        </g>
      )}

      {/* Floating 3D Callout Badge Above Room */}
      <g
        transform={`translate(${centerTop.x}, ${centerTop.y - (isSelected ? 10 : 0)})`}
        style={{ transition: "transform 0.3s ease" }}
      >
        <line x1="0" y1="12" x2="0" y2="26" stroke={isSelected ? "#1D4ED8" : "#64748B"} strokeWidth="1.6" />
        <circle cx="0" cy="26" r="2.8" fill={isSelected ? "#1D4ED8" : "#64748B"} />

        <rect
          x="-50"
          y="-15"
          width="100"
          height="28"
          rx="14"
          fill={isSelected ? "#0F172A" : "#FFFFFF"}
          stroke={isSelected ? "#3B82F6" : hasUnpaid ? "#EF4444" : "#CBD5E1"}
          strokeWidth={isSelected ? "2" : "1.2"}
          filter="drop-shadow(0 6px 12px rgba(15, 23, 42, 0.18))"
        />

        <circle
          cx="-36"
          cy="-1"
          r="4.2"
          fill={hasUnpaid ? "#EF4444" : isFull ? "#3B82F6" : "#10B981"}
        />

        <text
          x="-26"
          y="3"
          fontSize="11.5"
          fontWeight="800"
          fontFamily="Plus Jakarta Sans, Inter, sans-serif"
          fill={isSelected ? "#FFFFFF" : "#0F172A"}
        >
          RM {room.room_number}
        </text>
        <text
          x="24"
          y="3"
          fontSize="10.5"
          fontWeight="700"
          fontFamily="JetBrains Mono, monospace"
          fill={isSelected ? "#93C5FD" : "#64748B"}
        >
          {occupied}/{capacity}
        </text>
      </g>
    </g>
  );
}

/**
 * Decorative Isometric Tree & Streetlamp
 */
function IsoTree({ x, y, z = 0, scale = 1, originX = 430, originY = 215 }) {
  const trunkBase = iso(x, y, z, originX, originY);
  const crownCenter = iso(x, y, z + 20 * scale, originX, originY);
  const crownTop = iso(x, y, z + 33 * scale, originX, originY);
  return (
    <g pointerEvents="none">
      <ellipse cx={trunkBase.x} cy={trunkBase.y} rx={9 * scale} ry={5 * scale} fill="rgba(15,23,42,0.14)" />
      <line
        x1={trunkBase.x}
        y1={trunkBase.y}
        x2={crownCenter.x}
        y2={crownCenter.y}
        stroke="#78350F"
        strokeWidth={3.8 * scale}
        strokeLinecap="round"
      />
      <ellipse cx={crownCenter.x} cy={crownCenter.y} rx={13 * scale} ry={10.5 * scale} fill="#059669" />
      <ellipse cx={crownCenter.x - 2} cy={crownCenter.y - 2} rx={11 * scale} ry={8.5 * scale} fill="#10B981" />
      <ellipse cx={crownTop.x} cy={crownTop.y} rx={7.5 * scale} ry={6 * scale} fill="#34D399" />
    </g>
  );
}

/**
 * Main Isometric 3D Building Digital Twin Component
 */
export default function IsometricBuildingView({
  rooms = [],
  onEditRoom,
  onDeleteRoom,
  authFetch,
}) {
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [hoveredRoomId, setHoveredRoomId] = useState(null);
  const [floorFilter, setFloorFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPowerGrid, setShowPowerGrid] = useState(true);
  const [showWaterGrid, setShowWaterGrid] = useState(true);
  const [showRoof, setShowRoof] = useState(false);
  const [zoom, setZoom] = useState(1);

  const [tenants, setTenants] = useState([]);
  const [readings, setReadings] = useState([]);
  const [bills, setBills] = useState([]);
  const [rates, setRates] = useState([]);

  useEffect(() => {
    if (!authFetch) return;
    Promise.all([
      authFetch("/api/tenants").then((r) => r.json()).catch(() => ({ success: false })),
      authFetch("/api/meter-readings").then((r) => r.json()).catch(() => ({ success: false })),
      authFetch("/api/bills").then((r) => r.json()).catch(() => ({ success: false })),
      authFetch("/api/utility-rates").then((r) => r.json()).catch(() => ({ success: false })),
    ]).then(([tData, rData, bData, uData]) => {
      if (tData?.success) setTenants(tData.data || []);
      if (rData?.success) setReadings(rData.data || []);
      if (bData?.success) setBills(bData.data || []);
      if (uData?.success) setRates(uData.data || []);
    });
  }, [authFetch, rooms]);

  const effectiveSelectedId = useMemo(() => {
    if (selectedRoomId && rooms.some((r) => r.id === selectedRoomId)) {
      return selectedRoomId;
    }
    return rooms[0]?.id || null;
  }, [selectedRoomId, rooms]);

  const electricRate = useMemo(() => {
    const found = rates.find((r) => String(r.utility_type).toLowerCase() === "electricity");
    return found ? Number(found.rate_per_unit) : 14.25;
  }, [rates]);

  const waterRate = useMemo(() => {
    const found = rates.find((r) => String(r.utility_type).toLowerCase() === "water");
    return found ? Number(found.rate_per_unit) : 35.0;
  }, [rates]);

  // Aggregate live telemetry per room
  const roomTelemetryMap = useMemo(() => {
    const map = {};
    rooms.forEach((rm) => {
      const rmTenants = tenants.filter(
        (t) =>
          t.status === "Active" &&
          (Number(t.room_id) === Number(rm.id) || String(t.room_number) === String(rm.room_number))
      );
      const rmReadings = readings.filter(
        (r) =>
          String(r.room_number) === String(rm.room_number) ||
          rmTenants.some((t) => Number(t.id) === Number(r.tenant_id))
      );
      const rmBills = bills.filter(
        (b) =>
          String(b.room_number) === String(rm.room_number) ||
          rmTenants.some((t) => Number(t.id) === Number(b.tenant_id))
      );

      const kwh = rmReadings.reduce((sum, r) => sum + Number(r.electricity_consumption || 0), 0);
      const cum = rmReadings.reduce((sum, r) => sum + Number(r.water_consumption || 0), 0);
      const unpaidBills = rmBills.filter((b) => b.status === "Unpaid");
      const unpaidAmount = unpaidBills.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

      map[rm.id] = {
        tenants: rmTenants,
        readings: rmReadings,
        kwh,
        cum,
        unpaidCount: unpaidBills.length,
        unpaidAmount,
        bills: rmBills,
      };
    });
    return map;
  }, [rooms, tenants, readings, bills]);

  // Position rooms as a cohesive connected Apartment Wing (side-by-side along a shared corridor!)
  const ROOM_W = 114;
  const ROOM_D = 96;

  const positionedRooms = useMemo(() => {
    const sorted = [...rooms].sort((a, b) => Number(a.room_number) - Number(b.room_number));
    const floor1 = [];
    const floor2 = [];

    sorted.forEach((rm) => {
      const numStr = String(rm.room_number);
      if (numStr.startsWith("2") || numStr.startsWith("3")) {
        floor2.push(rm);
      } else {
        floor1.push(rm);
      }
    });

    const items = [];

    // Ground Floor Connected Wing (Rooms share partition walls seamlessly!)
    floor1.forEach((rm, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      items.push({
        room: rm,
        floor: 1,
        rx: 30 + col * ROOM_W,
        ry: 35 + row * (ROOM_D + 26),
        rz: 24,
      });
    });

    // 2nd Floor Connected Wing
    floor2.forEach((rm, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      items.push({
        room: rm,
        floor: 2,
        rx: 30 + col * ROOM_W,
        ry: -95 - row * (ROOM_D + 24),
        rz: 84,
      });
    });

    return items.filter((item) => {
      if (floorFilter !== "all" && String(item.floor) !== floorFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRoom = String(item.room.room_number).toLowerCase().includes(q);
        const matchTenant = (roomTelemetryMap[item.room.id]?.tenants || []).some((t) =>
          t.full_name?.toLowerCase().includes(q)
        );
        return matchRoom || matchTenant;
      }
      return true;
    });
  }, [rooms, floorFilter, searchQuery, roomTelemetryMap]);

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === effectiveSelectedId) || rooms[0] || null,
    [rooms, effectiveSelectedId]
  );

  const selectedStats = selectedRoom ? roomTelemetryMap[selectedRoom.id] : null;

  const buildingTotals = useMemo(() => {
    const totalBeds = rooms.reduce((s, r) => s + Number(r.capacity || 0), 0);
    const occupiedBeds = rooms.reduce((s, r) => s + Number(r.occupied_count || 0), 0);
    const totalKwh = Object.values(roomTelemetryMap).reduce((s, m) => s + (m.kwh || 0), 0);
    const totalWater = Object.values(roomTelemetryMap).reduce((s, m) => s + (m.cum || 0), 0);
    return { totalBeds, occupiedBeds, totalKwh, totalWater };
  }, [rooms, roomTelemetryMap]);

  const ORIGIN_X = 425;
  const ORIGIN_Y = 225;

  const wingCols = Math.max(1, Math.min(3, rooms.length || 3));
  const wingWidth = wingCols * ROOM_W;

  const powerHubPt = iso(-58, 92, 32, ORIGIN_X, ORIGIN_Y);
  const waterHubPt = iso(-58, 148, 28, ORIGIN_X, ORIGIN_Y);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "650px",
        borderRadius: "28px",
        overflow: "hidden",
        background: "linear-gradient(145deg, #EEF4FF 0%, #E2ECF8 52%, #D8E5F7 100%)",
        border: "1px solid rgba(37, 99, 235, 0.16)",
        boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
        display: "flex",
        flexDirection: "column",
        userSelect: "none",
      }}
    >
      <style>{`
        @keyframes taripaFlowDash {
          to { stroke-dashoffset: -28; }
        }
        @keyframes taripaPulse {
          0%, 100% { transform: scale(1); opacity: 0.75; }
          50% { transform: scale(1.45); opacity: 0.15; }
        }
        @keyframes taripaVanDrive {
          0%, 100% { transform: translate(0px, 0px); }
          50% { transform: translate(38px, 22px); }
        }
        .iso-flow-line {
          animation: taripaFlowDash 1s linear infinite;
        }
        .iso-flow-line-slow {
          animation: taripaFlowDash 1.7s linear infinite;
        }
        .iso-pulse-ring {
          transform-box: fill-box;
          transform-origin: center;
          animation: taripaPulse 2s ease-in-out infinite;
        }
        .iso-van-anim {
          animation: taripaVanDrive 7s ease-in-out infinite;
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════════
          TOP-LEFT FLOATING HUD: SEARCH & LIVE BUILDING TELEMETRY PILLS
      ══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "540px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(255, 255, 255, 0.90)",
            backdropFilter: "blur(16px)",
            padding: "8px 14px",
            borderRadius: "9999px",
            border: "1px solid rgba(255, 255, 255, 0.95)",
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.07)",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#0F172A",
              color: "#FFFFFF",
              fontSize: "11px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "9999px",
              letterSpacing: "0.02em",
            }}
          >
            <IconSparkles size={13} color="#60A5FA" /> 3D DIGITAL TWIN
          </span>
          <IconSearch size={15} color="#64748B" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search room # or tenant name..."
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "13px",
              fontWeight: 600,
              color: "#0F172A",
              width: "210px",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{
                border: "none",
                background: "#E2E8F0",
                color: "#475569",
                borderRadius: "9999px",
                padding: "2px 8px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Live Telemetry Mini Cards Row */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.88)",
              backdropFilter: "blur(12px)",
              padding: "8px 14px",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.9)",
              boxShadow: "0 8px 20px rgba(15, 23, 42, 0.05)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "10px",
                background: "#EFF6FF",
                color: "#2563EB",
                display: "grid",
                placeItems: "center",
              }}
            >
              <IconBolt size={16} />
            </span>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                Grid Load
              </div>
              <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#0F172A" }}>
                {buildingTotals.totalKwh.toFixed(1)} kWh
              </div>
            </div>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.88)",
              backdropFilter: "blur(12px)",
              padding: "8px 14px",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.9)",
              boxShadow: "0 8px 20px rgba(15, 23, 42, 0.05)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "10px",
                background: "#ECFEFF",
                color: "#0891B2",
                display: "grid",
                placeItems: "center",
              }}
            >
              <IconDroplet size={16} />
            </span>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                Water Flow
              </div>
              <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#0F172A" }}>
                {buildingTotals.totalWater.toFixed(1)} Cu.M
              </div>
            </div>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.88)",
              backdropFilter: "blur(12px)",
              padding: "8px 14px",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.9)",
              boxShadow: "0 8px 20px rgba(15, 23, 42, 0.05)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "10px",
                background: "#ECFDF5",
                color: "#059669",
                display: "grid",
                placeItems: "center",
              }}
            >
              <IconBed size={16} />
            </span>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                Occupancy
              </div>
              <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#0F172A" }}>
                {buildingTotals.occupiedBeds}/{buildingTotals.totalBeds} Beds
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CENTER STAGE: INTERACTIVE 3D ISOMETRIC BUILDING SVG CANVAS
      ══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          flex: 1,
          width: "100%",
          minHeight: "650px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingRight: "280px",
        }}
      >
        <svg
          viewBox="0 0 920 600"
          style={{
            width: "100%",
            height: "650px",
            transform: `scale(${zoom})`,
            transition: "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
            overflow: "visible",
          }}
        >
          <defs>
            <pattern id="isoGridPattern" width="40" height="23" patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 40 11.5 L 20 23 L 0 11.5 Z"
                fill="none"
                stroke="rgba(37, 99, 235, 0.08)"
                strokeWidth="1"
              />
            </pattern>
            <radialGradient id="stageGlow" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.88" />
              <stop offset="65%" stopColor="#DBEAFE" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#DBEAFE" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect x="-100" y="-100" width="1200" height="800" fill="url(#isoGridPattern)" />
          <ellipse cx="440" cy="330" rx="400" ry="225" fill="url(#stageGlow)" />

          {/* ── 1. PROPERTY FOUNDATION & CAMPUS GROUNDS ── */}
          <IsoBox
            x={-95}
            y={-65}
            z={0}
            dx={525}
            dy={350}
            dz={14}
            topColor="#DBEAFE"
            leftColor="#94A3B8"
            rightColor="#CBD5E1"
            stroke="#64748B"
            strokeWidth={1.2}
            originX={ORIGIN_X}
            originY={ORIGIN_Y}
          />

          {/* Landscaped Inner Courtyard Turf */}
          <IsoBox
            x={-80}
            y={-50}
            z={14}
            dx={495}
            dy={320}
            dz={5}
            topColor="#F1F5F9"
            leftColor="#CBD5E1"
            rightColor="#E2E8F0"
            stroke="#94A3B8"
            strokeWidth={0.8}
            originX={ORIGIN_X}
            originY={ORIGIN_Y}
          />

          {/* ── 2. UNIFIED APARTMENT BUILDING FOUNDATION PODIUM & FRONT CORRIDOR ── */}
          {/* Building Raised Concrete Podium */}
          <IsoBox
            x={20}
            y={25}
            z={19}
            dx={wingWidth + 20}
            dy={ROOM_D + 52}
            dz={6}
            topColor="#E2E8F0"
            leftColor="#475569"
            rightColor="#64748B"
            stroke="#334155"
            originX={ORIGIN_X}
            originY={ORIGIN_Y}
          />

          {/* Connected Front Hallway / Veranda Walkway in front of all rooms */}
          <IsoBox
            x={30}
            y={35 + ROOM_D}
            z={25}
            dx={wingWidth}
            dy={32}
            dz={3}
            topColor="#CBD5E1"
            leftColor="#64748B"
            rightColor="#94A3B8"
            stroke="#475569"
            originX={ORIGIN_X}
            originY={ORIGIN_Y}
          />

          {/* Front Entrance Steps leading from Roadway to Hallway */}
          <IsoBox
            x={30 + wingWidth / 2 - 28}
            y={35 + ROOM_D + 32}
            z={19}
            dx={56}
            dy={18}
            dz={5}
            topColor="#93C5FD"
            leftColor="#1D4ED8"
            rightColor="#2563EB"
            stroke="#1E3A8A"
            originX={ORIGIN_X}
            originY={ORIGIN_Y}
          />

          {/* Architectural Rear Blue Facade Header Wall (Gives it the viral blue building silhouette) */}
          <IsoBox
            x={26}
            y={27}
            z={25}
            dx={wingWidth + 8}
            dy={8}
            dz={66}
            topColor="#3B82F6"
            leftColor="#1E3A8A"
            rightColor="#1D4ED8"
            stroke="#172554"
            originX={ORIGIN_X}
            originY={ORIGIN_Y}
          />

          {/* Building Rooftop Sign ("TARIPA RESIDENCES") */}
          {(() => {
            const signAnchor = iso(30 + wingWidth / 2, 27, 102, ORIGIN_X, ORIGIN_Y);
            return (
              <g transform={`translate(${signAnchor.x}, ${signAnchor.y})`} pointerEvents="none">
                <rect
                  x="-76"
                  y="-13"
                  width="152"
                  height="22"
                  rx="8"
                  fill="#1E3A8A"
                  stroke="#60A5FA"
                  strokeWidth="1.2"
                />
                <text
                  x="0"
                  y="2"
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="800"
                  letterSpacing="0.08em"
                  fill="#FFFFFF"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  🏢 TARIPA RESIDENCES
                </text>
              </g>
            );
          })()}

          {/* Front Asphalt Street & Crosswalk */}
          <IsoBox
            x={-95}
            y={230}
            z={15}
            dx={525}
            dy={46}
            dz={5}
            topColor="#334155"
            leftColor="#0F172A"
            rightColor="#1E293B"
            stroke="#1E293B"
            originX={ORIGIN_X}
            originY={ORIGIN_Y}
          />
          {[-45, 35, 115, 195, 275, 355].map((rxVal, idx) => {
            const p1 = iso(rxVal, 253, 21, ORIGIN_X, ORIGIN_Y);
            const p2 = iso(rxVal + 40, 253, 21, ORIGIN_X, ORIGIN_Y);
            return (
              <line
                key={idx}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#F8FAFC"
                strokeWidth="2.2"
                strokeLinecap="round"
                opacity="0.75"
              />
            );
          })}

          {/* ── 3. MAIN MERALCO & MAYNILAD UTILITY DISTRIBUTION STATION ── */}
          <g>
            <IsoBox
              x={-72}
              y={65}
              z={19}
              dx={72}
              dy={125}
              dz={5}
              topColor="#CBD5E1"
              leftColor="#64748B"
              rightColor="#94A3B8"
              originX={ORIGIN_X}
              originY={ORIGIN_Y}
            />
            {/* Main Meralco Transformer Unit */}
            <IsoBox
              x={-60}
              y={76}
              z={24}
              dx={42}
              dy={40}
              dz={46}
              topColor="#60A5FA"
              leftColor="#1E3A8A"
              rightColor="#1D4ED8"
              stroke="#172554"
              originX={ORIGIN_X}
              originY={ORIGIN_Y}
            />
            {/* Main Water Pump & Filtration Tank */}
            <IsoBox
              x={-60}
              y={132}
              z={24}
              dx={42}
              dy={40}
              dz={36}
              topColor="#67E8F9"
              leftColor="#155E75"
              rightColor="#0891B2"
              stroke="#083344"
              originX={ORIGIN_X}
              originY={ORIGIN_Y}
            />
            {(() => {
              const hubLabel = iso(-40, 108, 86, ORIGIN_X, ORIGIN_Y);
              return (
                <g transform={`translate(${hubLabel.x}, ${hubLabel.y})`}>
                  <rect x="-50" y="-12" width="100" height="20" rx="6" fill="#0F172A" opacity="0.9" />
                  <text
                    x="0"
                    y="2"
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="800"
                    fill="#38BDF8"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    ⚡ MAIN GRID HUB
                  </text>
                </g>
              );
            })()}
          </g>

          {/* ── 4. ANIMATED POWER & WATER SUB-METER CONDUIT LINES ── */}
          {positionedRooms.map(({ room, rx, ry, rz }) => {
            const roomMeterPt = iso(rx + 25, ry + ROOM_D, rz + 22, ORIGIN_X, ORIGIN_Y);
            const midPowerPt = iso(-8, ry + ROOM_D + 8, rz + 12, ORIGIN_X, ORIGIN_Y);
            const midWaterPt = iso(-15, ry + ROOM_D + 14, rz + 8, ORIGIN_X, ORIGIN_Y);
            const isSel = room.id === effectiveSelectedId;
            const isActiveRoom = Number(room.occupied_count || 0) > 0;

            return (
              <g key={`conduit-${room.id}`} pointerEvents="none">
                {showPowerGrid && (
                  <>
                    <path
                      d={`M ${powerHubPt.x} ${powerHubPt.y} L ${midPowerPt.x} ${midPowerPt.y} L ${roomMeterPt.x} ${roomMeterPt.y}`}
                      fill="none"
                      stroke={isSel ? "#2563EB" : "#93C5FD"}
                      strokeWidth={isSel ? "3.2" : "1.8"}
                      opacity={isActiveRoom ? 0.9 : 0.35}
                    />
                    {isActiveRoom && (
                      <path
                        d={`M ${powerHubPt.x} ${powerHubPt.y} L ${midPowerPt.x} ${midPowerPt.y} L ${roomMeterPt.x} ${roomMeterPt.y}`}
                        fill="none"
                        stroke={isSel ? "#FACC15" : "#2563EB"}
                        strokeWidth={isSel ? "3.2" : "2.2"}
                        strokeDasharray="6 8"
                        className="iso-flow-line"
                      />
                    )}
                  </>
                )}

                {showWaterGrid && (
                  <>
                    <path
                      d={`M ${waterHubPt.x} ${waterHubPt.y} L ${midWaterPt.x} ${midWaterPt.y} L ${roomMeterPt.x} ${roomMeterPt.y + 4}`}
                      fill="none"
                      stroke={isSel ? "#0891B2" : "#A5F3FC"}
                      strokeWidth={isSel ? "2.6" : "1.5"}
                      opacity={isActiveRoom ? 0.8 : 0.3}
                    />
                    {isActiveRoom && (
                      <path
                        d={`M ${waterHubPt.x} ${waterHubPt.y} L ${midWaterPt.x} ${midWaterPt.y} L ${roomMeterPt.x} ${roomMeterPt.y + 4}`}
                        fill="none"
                        stroke="#06B6D4"
                        strokeWidth="2.2"
                        strokeDasharray="4 10"
                        className="iso-flow-line-slow"
                      />
                    )}
                  </>
                )}
              </g>
            );
          })}

          {/* ── 5. 3D ISOMETRIC ROOM UNITS (Sorted back-to-front) ── */}
          {[...positionedRooms]
            .sort((a, b) => a.rx + a.ry + a.rz - (b.rx + b.ry + b.rz))
            .map(({ room, rx, ry, rz }) => (
              <IsoRoomUnit
                key={room.id}
                room={room}
                rx={rx}
                ry={ry}
                rz={rz}
                W={ROOM_W}
                D={ROOM_D}
                isSelected={room.id === effectiveSelectedId}
                isHovered={room.id === hoveredRoomId}
                onSelect={(rm) => setSelectedRoomId(rm.id)}
                onHover={setHoveredRoomId}
                showPower={showPowerGrid}
                showWater={showWaterGrid}
                showRoof={showRoof}
                roomStats={roomTelemetryMap[room.id]}
                originX={ORIGIN_X}
                originY={ORIGIN_Y}
              />
            ))}

          {/* Hallway Front Pillars along the Veranda */}
          {Array.from({ length: wingCols + 1 }).map((_, idx) => (
            <IsoBox
              key={`pillar-${idx}`}
              x={30 + idx * ROOM_W - (idx === wingCols ? 6 : 0)}
              y={35 + ROOM_D + 26}
              z={28}
              dx={6}
              dy={6}
              dz={50}
              topColor="#93C5FD"
              leftColor="#1E3A8A"
              rightColor="#2563EB"
              stroke="#172554"
              originX={ORIGIN_X}
              originY={ORIGIN_Y}
            />
          ))}

          {/* ── 6. LANDSCAPE TREES & ANIMATED UTILITY SERVICE VEHICLE ── */}
          <IsoTree x={-55} y={-20} z={19} scale={1.15} originX={ORIGIN_X} originY={ORIGIN_Y} />
          <IsoTree x={35} y={-25} z={19} scale={0.95} originX={ORIGIN_X} originY={ORIGIN_Y} />
          <IsoTree x={400} y={195} z={19} scale={1.15} originX={ORIGIN_X} originY={ORIGIN_Y} />
          <IsoTree x={400} y={70} z={19} scale={0.95} originX={ORIGIN_X} originY={ORIGIN_Y} />

          {/* Animated Utility Service Truck on Front Road */}
          <g className="iso-van-anim" pointerEvents="none">
            <IsoBox
              x={65}
              y={238}
              z={21}
              dx={44}
              dy={20}
              dz={21}
              topColor="#FFFFFF"
              leftColor="#CBD5E1"
              rightColor="#E2E8F0"
              stroke="#475569"
              originX={ORIGIN_X}
              originY={ORIGIN_Y}
            />
            <IsoBox
              x={65}
              y={238}
              z={28}
              dx={44}
              dy={20.5}
              dz={4.5}
              topColor="#2563EB"
              leftColor="#1D4ED8"
              rightColor="#3B82F6"
              stroke="none"
              originX={ORIGIN_X}
              originY={ORIGIN_Y}
            />
            <IsoBox
              x={109}
              y={239}
              z={21}
              dx={16}
              dy={18}
              dz={15}
              topColor="#3B82F6"
              leftColor="#1D4ED8"
              rightColor="#2563EB"
              stroke="#1E3A8A"
              originX={ORIGIN_X}
              originY={ORIGIN_Y}
            />
          </g>
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TOP-RIGHT FLOATING HUD: SELECTED ROOM INSPECTOR PANEL
      ══════════════════════════════════════════════════════════════════ */}
      {selectedRoom && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            bottom: "88px",
            width: "325px",
            zIndex: 10,
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(20px)",
            borderRadius: "24px",
            border: "1px solid rgba(255, 255, 255, 0.95)",
            boxShadow: "0 20px 40px rgba(15, 23, 42, 0.10)",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: 800,
                  color: "#2563EB",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                LIVE UNIT TELEMETRY
              </span>
              <h3
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "#0F172A",
                  margin: "2px 0 0",
                  letterSpacing: "-0.02em",
                }}
              >
                Room {selectedRoom.room_number}
              </h3>
            </div>

            {(() => {
              const occ = Number(selectedRoom.occupied_count || 0);
              const cap = Number(selectedRoom.capacity || 1);
              const full = occ >= cap;
              return (
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    background: full ? "#EEF2FF" : "#ECFDF5",
                    color: full ? "#4338CA" : "#059669",
                    border: full ? "1px solid #C7D2FE" : "1px solid #A7F3D0",
                  }}
                >
                  {full ? "Full Unit" : `${cap - occ} Slot${cap - occ === 1 ? "" : "s"} Open`}
                </span>
              );
            })()}
          </div>

          {/* Visual Bedspace Occupancy Matrix */}
          <div
            style={{
              background: "#F8FAFC",
              borderRadius: "16px",
              padding: "12px 14px",
              border: "1px solid #E2E8F0",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "8px" }}>
              <span style={{ fontWeight: 700, color: "#334155" }}>Bedspace Capacity</span>
              <span style={{ fontWeight: 800, color: "#0F172A" }}>
                {selectedRoom.occupied_count || 0} / {selectedRoom.capacity} Occupied
              </span>
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {Array.from({ length: Number(selectedRoom.capacity || 1) }).map((_, idx) => {
                const isOcc = idx < Number(selectedRoom.occupied_count || 0);
                return (
                  <div
                    key={idx}
                    style={{
                      flex: "1 1 40px",
                      height: "28px",
                      borderRadius: "8px",
                      background: isOcc ? "#2563EB" : "#E2E8F0",
                      color: isOcc ? "#FFFFFF" : "#64748B",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    <IconBed size={13} /> #{idx + 1}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Sub-Meter Telemetry (Electricity & Water) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div
              style={{
                background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
                borderRadius: "16px",
                padding: "12px",
                border: "1px solid #BFDBFE",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#1D4ED8", fontSize: "11px", fontWeight: 700 }}>
                <IconBolt size={14} /> ELECTRICITY
              </div>
              <div style={{ fontSize: "17px", fontWeight: 800, color: "#0F172A", marginTop: "4px" }}>
                {(selectedStats?.kwh || 0).toFixed(1)} <span style={{ fontSize: "11px", fontWeight: 600 }}>kWh</span>
              </div>
              <div style={{ fontSize: "11px", color: "#1E40AF", fontWeight: 600, marginTop: "2px" }}>
                {formatPHP((selectedStats?.kwh || 0) * electricRate)}
              </div>
            </div>

            <div
              style={{
                background: "linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 100%)",
                borderRadius: "16px",
                padding: "12px",
                border: "1px solid #A5F3FC",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0E7490", fontSize: "11px", fontWeight: 700 }}>
                <IconDroplet size={14} /> WATER
              </div>
              <div style={{ fontSize: "17px", fontWeight: 800, color: "#0F172A", marginTop: "4px" }}>
                {(selectedStats?.cum || 0).toFixed(1)} <span style={{ fontSize: "11px", fontWeight: 600 }}>m³</span>
              </div>
              <div style={{ fontSize: "11px", color: "#155E75", fontWeight: 600, marginTop: "2px" }}>
                {formatPHP((selectedStats?.cum || 0) * waterRate)}
              </div>
            </div>
          </div>

          {/* Assigned Tenants in this Room */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ fontSize: "11.5px", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Assigned Tenants ({selectedStats?.tenants?.length || 0})
            </div>

            {!selectedStats?.tenants || selectedStats.tenants.length === 0 ? (
              <div
                style={{
                  padding: "18px 12px",
                  borderRadius: "14px",
                  background: "#F8FAFC",
                  border: "1px dashed #CBD5E1",
                  textAlign: "center",
                  color: "#64748B",
                  fontSize: "12.5px",
                }}
              >
                No active tenants assigned to Room {selectedRoom.room_number}.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {selectedStats.tenants.map((t) => {
                  const tenantBills = (selectedStats.bills || []).filter(
                    (b) => Number(b.tenant_id) === Number(t.id)
                  );
                  const latestBill = tenantBills[0] || null;
                  const moveInStr = t.move_in_date
                    ? new Date(t.move_in_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : null;

                  return (
                    <div
                      key={t.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        borderRadius: "14px",
                        background: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <span
                          style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "9999px",
                            background: "#DBEAFE",
                            color: "#1D4ED8",
                            fontWeight: 800,
                            fontSize: "12px",
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          {t.full_name?.charAt(0)?.toUpperCase() || "T"}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: 700,
                              color: "#0F172A",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {t.full_name}
                          </div>
                          <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>
                            {latestBill
                              ? `Latest Bill: ${formatPHP(latestBill.total_amount)}`
                              : t.contact_number || (moveInStr ? `Moved in ${moveInStr}` : "Active Resident")}
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "10.5px",
                          fontWeight: 700,
                          color: latestBill?.status === "Unpaid" ? "#DC2626" : "#059669",
                          background: latestBill?.status === "Unpaid" ? "#FEF2F2" : "#ECFDF5",
                          padding: "2px 8px",
                          borderRadius: "9999px",
                          flexShrink: 0,
                        }}
                      >
                        {latestBill?.status === "Unpaid" ? "Unpaid" : "Active"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedStats?.unpaidCount > 0 && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "14px",
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#DC2626",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              <IconAlertTriangle size={16} />
              <span>
                {selectedStats.unpaidCount} Unpaid Bill ({formatPHP(selectedStats.unpaidAmount)})
              </span>
            </div>
          )}

          {/* Inspector Quick Actions */}
          <div style={{ display: "flex", gap: "8px", paddingTop: "8px", borderTop: "1px solid #E2E8F0" }}>
            <button
              type="button"
              onClick={() => onEditRoom && onEditRoom(selectedRoom)}
              className="btn-pill-action"
              style={{ flex: 1, height: "38px", fontSize: "12.5px", fontWeight: 700 }}
            >
              <IconEdit size={15} /> Edit Room
            </button>
            <button
              type="button"
              onClick={() => onDeleteRoom && onDeleteRoom(selectedRoom)}
              disabled={Number(selectedRoom.occupied_count) > 0}
              className="btn-pill-action btn-pill-action-danger"
              style={{ flex: 1, height: "38px", fontSize: "12.5px", fontWeight: 700 }}
              title={Number(selectedRoom.occupied_count) > 0 ? "Cannot delete room with active tenants" : undefined}
            >
              <IconTrash size={15} /> Delete
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          BOTTOM-LEFT FLOATING HUD: SUB-METER PIPELINE TRACKER
      ══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "20px",
          zIndex: 10,
          background: "rgba(255, 255, 255, 0.90)",
          backdropFilter: "blur(16px)",
          borderRadius: "20px",
          padding: "12px 18px",
          border: "1px solid rgba(255, 255, 255, 0.95)",
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#10B981",
              boxShadow: "0 0 0 4px rgba(16, 185, 129, 0.2)",
            }}
          />
          <div>
            <div style={{ fontSize: "10px", fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>
              Sub-Meter Feed
            </div>
            <div style={{ fontSize: "12.5px", fontWeight: 800, color: "#0F172A" }}>
              {selectedRoom ? `Main Grid → RM ${selectedRoom.room_number}` : "Main Utility Grid"}
            </div>
          </div>
        </div>

        <div style={{ width: "1px", height: "28px", background: "#CBD5E1" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {[
            { id: "all", label: "All Floors" },
            { id: "1", label: "1st Floor" },
            { id: "2", label: "2nd Floor" },
          ].map((fl) => (
            <button
              key={fl.id}
              type="button"
              onClick={() => setFloorFilter(fl.id)}
              style={{
                padding: "5px 11px",
                borderRadius: "9999px",
                border: "none",
                fontSize: "11.5px",
                fontWeight: 700,
                cursor: "pointer",
                background: floorFilter === fl.id ? "#2563EB" : "transparent",
                color: floorFilter === fl.id ? "#FFFFFF" : "#64748B",
                transition: "all 0.15s ease",
              }}
            >
              {fl.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          BOTTOM-RIGHT FLOATING HUD: LAYER TOGGLES & ZOOM CONTROLS
      ══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(255, 255, 255, 0.90)",
          backdropFilter: "blur(16px)",
          padding: "8px 12px",
          borderRadius: "9999px",
          border: "1px solid rgba(255, 255, 255, 0.95)",
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
        }}
      >
        <button
          type="button"
          onClick={() => setShowPowerGrid((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "6px 12px",
            borderRadius: "9999px",
            border: "none",
            fontSize: "11.5px",
            fontWeight: 700,
            cursor: "pointer",
            background: showPowerGrid ? "#EFF6FF" : "transparent",
            color: showPowerGrid ? "#2563EB" : "#64748B",
          }}
        >
          <IconBolt size={14} /> Power Grid
        </button>

        <button
          type="button"
          onClick={() => setShowWaterGrid((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "6px 12px",
            borderRadius: "9999px",
            border: "none",
            fontSize: "11.5px",
            fontWeight: 700,
            cursor: "pointer",
            background: showWaterGrid ? "#ECFEFF" : "transparent",
            color: showWaterGrid ? "#0891B2" : "#64748B",
          }}
        >
          <IconDroplet size={14} /> Water Lines
        </button>

        <button
          type="button"
          onClick={() => setShowRoof((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "6px 12px",
            borderRadius: "9999px",
            border: "none",
            fontSize: "11.5px",
            fontWeight: 700,
            cursor: "pointer",
            background: showRoof ? "#EEF2FF" : "transparent",
            color: showRoof ? "#4F46E5" : "#64748B",
          }}
        >
          <IconLayersSubtract size={14} /> {showRoof ? "Roof On" : "Cutaway"}
        </button>

        <div style={{ width: "1px", height: "20px", background: "#CBD5E1" }} />

        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.8, Number((z - 0.1).toFixed(2))))}
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            border: "none",
            background: "#F1F5F9",
            color: "#334155",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
        >
          <IconMinimize size={14} />
        </button>
        <button
          type="button"
          onClick={() => setZoom(1)}
          style={{
            border: "none",
            background: "transparent",
            fontSize: "11px",
            fontWeight: 800,
            color: "#475569",
            cursor: "pointer",
            padding: "0 4px",
          }}
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(1.3, Number((z + 0.1).toFixed(2))))}
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            border: "none",
            background: "#F1F5F9",
            color: "#334155",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
        >
          <IconMaximize size={14} />
        </button>
      </div>
    </div>
  );
}
