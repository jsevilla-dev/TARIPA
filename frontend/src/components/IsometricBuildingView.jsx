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
const iso = (x, y, z = 0, originX = 0, originY = 0) => {
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
  originX = 0,
  originY = 0,
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
  originX = 0,
  originY = 0,
}) {
  const H = 48; // Wall height
  const wallT = 6;

  const liftZ = isSelected ? 10 : isHovered ? 5 : 0;
  const z = rz + liftZ;

  const occupied = Number(room.occupied_count || 0);
  const capacity = Math.max(1, Number(room.capacity || 4));
  const isFull = occupied >= capacity;
  const hasUnpaid = roomStats?.unpaidCount > 0;

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

  const centerTop = iso(rx + W / 2, ry + D / 2, z + H + 22, originX, originY);
  const centerFloor = iso(rx + W / 2, ry + D / 2, z + 6, originX, originY);

  // Calculate bed positions inside the room (up to 6 visible beds)
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

  const meterPos = iso(rx + 26, ry + D + 3, z + 22, originX, originY);

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

      {/* 2. Rear Wall */}
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

      {/* 3. Left Partition Wall */}
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

      {/* Interior Wardrobe Cabinet */}
      <IsoBox
        x={rx + W - 22}
        y={ry + 10}
        z={z + 6}
        dx={14}
        dy={22}
        dz={30}
        topColor="#F1F5F9"
        leftColor="#94A3B8"
        rightColor="#CBD5E1"
        stroke="#475569"
        strokeWidth={0.7}
        originX={originX}
        originY={originY}
      />

      {/* 4. Interior 3D Beds */}
      {beds.map((b) => (
        <g key={b.id}>
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
        dz={18}
        topColor={palette.wallTop}
        leftColor={palette.wallLeft}
        rightColor={palette.wallRight}
        stroke={palette.stroke}
        originX={originX}
        originY={originY}
      />

      {/* 6. Front Hallway Wall with Doorway Cutout */}
      <IsoBox
        x={rx}
        y={ry + D - wallT}
        z={z + 6}
        dx={W * 0.62}
        dy={wallT}
        dz={26}
        topColor={palette.wallTop}
        leftColor={palette.wallLeft}
        rightColor={palette.wallRight}
        stroke={palette.stroke}
        originX={originX}
        originY={originY}
      />

      {/* Welcome Door Mat */}
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

      {/* Wall-Mounted Smart Sub-Meter Box */}
      <IsoBox
        x={rx + 18}
        y={ry + D}
        z={z + 14}
        dx={16}
        dy={4}
        dz={13}
        topColor="#F8FAFC"
        leftColor="#0F172A"
        rightColor="#1E293B"
        stroke="#334155"
        strokeWidth={0.7}
        originX={originX}
        originY={originY}
      />
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

      {/* Optional Architectural Roof Overhang */}
      {showRoof && (
        <g>
          <IsoBox
            x={rx - 2}
            y={ry - 2}
            z={z + H + 6}
            dx={W + 4}
            dy={D + 8}
            dz={6}
            topColor="#2563EB"
            leftColor="#1E3A8A"
            rightColor="#1D4ED8"
            stroke="#172554"
            opacity={0.78}
            originX={originX}
            originY={originY}
          />
          <IsoBox
            x={rx + 16}
            y={ry + 14}
            z={z + H + 12}
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
            rx="22"
            ry="12"
            fill="rgba(37, 99, 235, 0.22)"
            stroke="#2563EB"
            strokeWidth="1.5"
          />
        </g>
      )}

      {/* Floating 3D Callout Badge Above Room */}
      <g
        transform={`translate(${centerTop.x}, ${centerTop.y - (isSelected ? 8 : 0)})`}
        style={{ transition: "transform 0.3s ease" }}
      >
        <line x1="0" y1="11" x2="0" y2="23" stroke={isSelected ? "#1D4ED8" : "#64748B"} strokeWidth="1.5" />
        <circle cx="0" cy="23" r="2.5" fill={isSelected ? "#1D4ED8" : "#64748B"} />

        <rect
          x="-48"
          y="-14"
          width="96"
          height="26"
          rx="13"
          fill={isSelected ? "#0F172A" : "#FFFFFF"}
          stroke={isSelected ? "#3B82F6" : hasUnpaid ? "#EF4444" : "#CBD5E1"}
          strokeWidth={isSelected ? "2" : "1.2"}
          filter="drop-shadow(0 5px 10px rgba(15, 23, 42, 0.16))"
        />

        <circle
          cx="-35"
          cy="-1"
          r="4"
          fill={hasUnpaid ? "#EF4444" : isFull ? "#3B82F6" : "#10B981"}
        />

        <text
          x="-25"
          y="3"
          fontSize="11"
          fontWeight="800"
          fontFamily="Plus Jakarta Sans, Inter, sans-serif"
          fill={isSelected ? "#FFFFFF" : "#0F172A"}
        >
          RM {room.room_number}
        </text>
        <text
          x="22"
          y="3"
          fontSize="10"
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
 * Decorative Isometric Tree
 */
function IsoTree({ x, y, z = 0, scale = 1, originX = 0, originY = 0 }) {
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
 * Dynamically scales its building podium, hallways, roads, pillars, and SVG viewBox
 * to support ANY number of rooms (1 to 30+) with ZERO overlapping!
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

  const ROOM_W = 114;
  const ROOM_D = 96;
  const ROW_CORRIDOR_GAP = 26; // Internal walkway between rows of rooms

  /**
   * Smart Floor & Grid Layout Engine:
   * - Filters rooms by search query & floor filter
   * - Assigns floor based on room number (200+ -> Floor 2, or if > 6 rooms on Floor 1, splits neatly)
   * - Dynamically computes exact building width, depth, podium, front veranda, road, and camera bounds!
   */
  const campusLayout = useMemo(() => {
    const sorted = [...rooms].sort((a, b) => Number(a.room_number) - Number(b.room_number));

    // Filter by search query first
    const searched = sorted.filter((rm) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchRoom = String(rm.room_number).toLowerCase().includes(q);
      const matchTenant = (roomTelemetryMap[rm.id]?.tenants || []).some((t) =>
        t.full_name?.toLowerCase().includes(q)
      );
      return matchRoom || matchTenant;
    });

    // Boarding house floor capacity rule (Max 6 rooms on 1st Floor; overflow or 2xx goes to 2nd Floor)
    const MAX_PER_FLOOR = 6;
    let f1Assigned = 0;
    const roomFloorMap = {};

    const withFloors = searched.map((rm) => {
      const s = String(rm.room_number);
      const isExplicit2nd = s.startsWith("2") || s.startsWith("3") || s.startsWith("4");
      let fl = 1;
      if (isExplicit2nd || f1Assigned >= MAX_PER_FLOOR) {
        fl = 2;
      } else {
        fl = 1;
        f1Assigned += 1;
      }
      roomFloorMap[rm.id] = fl;
      return { room: rm, floor: fl };
    });

    const floor1Count = withFloors.filter((i) => i.floor === 1).length;
    const floor2Count = withFloors.filter((i) => i.floor === 2).length;

    const visibleList = withFloors.filter((item) => {
      if (floorFilter === "all") return true;
      return String(item.floor) === floorFilter;
    });

    // Arrange all currently visible rooms in a clean, cohesive architectural grid on the podium
    // Max 3 rooms per row (or 4 if >= 8 rooms)
    const maxCols = visibleList.length >= 8 ? 4 : Math.max(1, Math.min(3, visibleList.length || 3));
    const totalRows = Math.max(1, Math.ceil(visibleList.length / maxCols));

    const START_X = 30;
    const START_Y = 35;

    const positioned = visibleList.map((item, idx) => {
      const col = idx % maxCols;
      const row = Math.floor(idx / maxCols);
      return {
        ...item,
        col,
        row,
        rx: START_X + col * ROOM_W,
        ry: START_Y + row * (ROOM_D + ROW_CORRIDOR_GAP),
        rz: 25,
      };
    });

    // Dynamic Building Dimensions
    const wingWidth = maxCols * ROOM_W;
    const roomsTotalDepth = totalRows * ROOM_D + Math.max(0, totalRows - 1) * ROW_CORRIDOR_GAP;
    const verandaY = START_Y + roomsTotalDepth;
    const verandaDepth = 32;
    const stepsY = verandaY + verandaDepth;
    const roadY = stepsY + 26;
    const lotDepth = roadY + 125;
    const lotWidth = wingWidth + 205;

    // Compute exact 2D isometric bounding box so SVG viewBox auto-fits any number of rooms!
    const corners = [
      iso(-105, -75, 0),
      iso(-105 + lotWidth, -75, 0),
      iso(-105 + lotWidth, -75 + lotDepth, 0),
      iso(-105, -75 + lotDepth, 0),
      iso(START_X + wingWidth / 2, START_Y, 168), // Rooftop sign peak
    ];
    const xs = corners.map((c) => c.x);
    const ys = corners.map((c) => c.y);
    const minX = Math.min(...xs) - 45;
    const maxX = Math.max(...xs) + 55;
    const minY = Math.min(...ys) - 45;
    const maxY = Math.max(...ys) + 45;

    return {
      positioned,
      maxCols,
      totalRows,
      START_X,
      START_Y,
      wingWidth,
      roomsTotalDepth,
      verandaY,
      verandaDepth,
      stepsY,
      roadY,
      lotDepth,
      lotWidth,
      floor1Count,
      floor2Count,
      roomFloorMap,
      viewBox: `${Math.round(minX)} ${Math.round(minY)} ${Math.round(maxX - minX)} ${Math.round(maxY - minY)}`,
    };
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

  const {
    positioned: positionedRooms,
    maxCols,
    totalRows,
    START_X,
    START_Y,
    wingWidth,
    roomsTotalDepth,
    verandaY,
    verandaDepth,
    stepsY,
    roadY,
    lotDepth,
    lotWidth,
    floor1Count,
    floor2Count,
    roomFloorMap,
    viewBox,
  } = campusLayout;

  // Main Utility Hub coordinates (dynamically centered alongside the left of the building)
  const hubBaseY = START_Y + Math.max(20, roomsTotalDepth / 2 - 60);
  const powerHubPt = iso(-58, hubBaseY + 26, 32);
  const waterHubPt = iso(-58, hubBaseY + 82, 28);

  return (
    <div
      className="iso-twin-shell"
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
        @keyframes taripaVanMeralco {
          0%, 100% { transform: translate(0px, 0px); }
          50% { transform: translate(26px, 15px); }
        }
        @keyframes taripaVanMaynilad {
          0%, 100% { transform: translate(22px, 12.7px); }
          50% { transform: translate(-8px, -4.6px); }
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
        .iso-van-meralco {
          animation: taripaVanMeralco 7.5s ease-in-out infinite;
        }
        .iso-van-maynilad {
          animation: taripaVanMaynilad 8.5s ease-in-out infinite;
        }
        @media (max-width: 960px) {
          .iso-twin-shell {
            min-height: auto !important;
            padding: 14px !important;
            gap: 12px !important;
            border-radius: 22px !important;
          }
          .iso-hud-top-left {
            position: relative !important;
            top: auto !important;
            left: auto !important;
            max-width: 100% !important;
            width: 100% !important;
            order: 1;
          }
          .iso-search-pill {
            width: 100% !important;
            flex-wrap: wrap !important;
            border-radius: 18px !important;
          }
          .iso-search-input {
            width: auto !important;
            flex: 1 1 140px !important;
            min-width: 0 !important;
          }
          .iso-telemetry-row {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;
          }
          .iso-telemetry-card {
            padding: 8px 10px !important;
            gap: 6px !important;
          }
          .iso-canvas-stage {
            min-height: 290px !important;
            padding: 8px 0 !important;
            order: 2;
          }
          .iso-svg {
            height: clamp(250px, 64vw, 390px) !important;
          }
          .iso-hud-bottom-left {
            position: relative !important;
            bottom: auto !important;
            left: auto !important;
            width: 100% !important;
            flex-wrap: wrap !important;
            justify-content: space-between !important;
            gap: 10px !important;
            padding: 10px 12px !important;
            order: 3;
          }
          .iso-hud-bottom-right {
            position: relative !important;
            bottom: auto !important;
            right: auto !important;
            width: 100% !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
            border-radius: 18px !important;
            padding: 8px 10px !important;
            order: 4;
          }
          .iso-hud-inspector {
            position: relative !important;
            top: auto !important;
            right: auto !important;
            bottom: auto !important;
            width: 100% !important;
            max-height: none !important;
            order: 5;
          }
        }
        @media (max-width: 480px) {
          .iso-telemetry-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════════
          TOP-LEFT FLOATING HUD: SEARCH & LIVE BUILDING TELEMETRY PILLS
      ══════════════════════════════════════════════════════════════════ */}
      <div
        className="iso-hud-top-left"
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
          className="iso-search-pill"
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
              flexShrink: 0,
            }}
          >
            <IconSparkles size={13} color="#60A5FA" /> 3D DIGITAL TWIN
          </span>
          <IconSearch size={15} color="#64748B" />
          <input
            type="text"
            className="iso-search-input"
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
        <div className="iso-telemetry-row" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <div
            className="iso-telemetry-card"
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
                flexShrink: 0,
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
            className="iso-telemetry-card"
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
                flexShrink: 0,
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
            className="iso-telemetry-card"
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
                flexShrink: 0,
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
          CENTER STAGE: DYNAMICALLY SCALED 3D ISOMETRIC BUILDING SVG CANVAS
      ══════════════════════════════════════════════════════════════════ */}
      <div
        className="iso-canvas-stage"
        style={{
          flex: 1,
          width: "100%",
          minHeight: "650px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingRight: "300px",
          paddingTop: "40px",
          paddingBottom: "40px",
        }}
      >
        <svg
          className="iso-svg"
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          style={{
            width: "100%",
            height: "580px",
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
          </defs>

          {/* Infinite Isometric Background Grid */}
          <rect x="-1500" y="-1500" width="3500" height="3500" fill="url(#isoGridPattern)" />

          {/* ── 1. DYNAMIC PROPERTY BASEPLATE & CAMPUS GROUNDS ── */}
          <IsoBox
            x={-95}
            y={-65}
            z={0}
            dx={lotWidth}
            dy={lotDepth}
            dz={14}
            topColor="#DBEAFE"
            leftColor="#94A3B8"
            rightColor="#CBD5E1"
            stroke="#64748B"
            strokeWidth={1.2}
          />

          {/* Landscaped Inner Courtyard Turf */}
          <IsoBox
            x={-80}
            y={-50}
            z={14}
            dx={lotWidth - 30}
            dy={lotDepth - 30}
            dz={5}
            topColor="#F1F5F9"
            leftColor="#CBD5E1"
            rightColor="#E2E8F0"
            stroke="#94A3B8"
            strokeWidth={0.8}
          />

          {/* ── 2. DYNAMIC UNIFIED APARTMENT BUILDING PODIUM & WALKWAYS ── */}
          {/* Building Raised Concrete Podium wrapping all room rows */}
          <IsoBox
            x={START_X - 10}
            y={START_Y - 10}
            z={19}
            dx={wingWidth + 20}
            dy={roomsTotalDepth + verandaDepth + 18}
            dz={6}
            topColor="#E2E8F0"
            leftColor="#475569"
            rightColor="#64748B"
            stroke="#334155"
          />

          {/* Internal Hallway Corridors between rows (when totalRows > 1) */}
          {Array.from({ length: Math.max(0, totalRows - 1) }).map((_, rIdx) => (
            <IsoBox
              key={`corridor-${rIdx}`}
              x={START_X}
              y={START_Y + (rIdx + 1) * ROOM_D + rIdx * ROW_CORRIDOR_GAP}
              z={25}
              dx={wingWidth}
              dy={ROW_CORRIDOR_GAP}
              dz={2}
              topColor="#CBD5E1"
              leftColor="#64748B"
              rightColor="#94A3B8"
              stroke="#475569"
            />
          ))}

          {/* Connected Front Hallway / Veranda Walkway at the front edge of the building */}
          <IsoBox
            x={START_X}
            y={verandaY}
            z={25}
            dx={wingWidth}
            dy={verandaDepth}
            dz={3}
            topColor="#CBD5E1"
            leftColor="#64748B"
            rightColor="#94A3B8"
            stroke="#475569"
          />

          {/* Front Entrance Steps leading from Roadway to Front Veranda */}
          <IsoBox
            x={START_X + wingWidth / 2 - 30}
            y={stepsY}
            z={19}
            dx={60}
            dy={18}
            dz={5}
            topColor="#93C5FD"
            leftColor="#1D4ED8"
            rightColor="#2563EB"
            stroke="#1E3A8A"
          />

          {/* Architectural Rear Blue Facade Wall (Dynamic height for 1st vs 2nd floor) */}
          <IsoBox
            x={START_X - 4}
            y={START_Y - 8}
            z={25}
            dx={wingWidth + 8}
            dy={8}
            dz={positionedRooms.some((r) => r.rz > 30) ? 114 : 64}
            topColor="#3B82F6"
            leftColor="#1E3A8A"
            rightColor="#1D4ED8"
            stroke="#172554"
          />

          {/* ── 3. DYNAMIC FRONT ASPHALT STREET & CROSSWALK (Always in front of all rooms!) ── */}
          <IsoBox
            x={-95}
            y={roadY}
            z={15}
            dx={lotWidth}
            dy={52}
            dz={5}
            topColor="#334155"
            leftColor="#0F172A"
            rightColor="#1E293B"
            stroke="#1E293B"
          />
          {Array.from({ length: Math.ceil(lotWidth / 80) }).map((_, idx) => {
            const rxVal = -50 + idx * 80;
            if (rxVal + 40 > -95 + lotWidth - 20) return null;
            const p1 = iso(rxVal, roadY + 26, 21);
            const p2 = iso(rxVal + 40, roadY + 26, 21);
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

          {/* ── 4. MAIN MERALCO & MAYNILAD UTILITY DISTRIBUTION STATION ── */}
          <g>
            {/* Concrete Utility Pad */}
            <IsoBox
              x={-72}
              y={hubBaseY}
              z={19}
              dx={72}
              dy={125}
              dz={5}
              topColor="#E2E8F0"
              leftColor="#94A3B8"
              rightColor="#CBD5E1"
              stroke="#64748B"
            />

            {/* Box 1: Meralco Main Power Transformer Hub (Upper Box) */}
            <IsoBox
              x={-60}
              y={hubBaseY + 11}
              z={24}
              dx={42}
              dy={40}
              dz={42}
              topColor="#FFFFFF"
              leftColor="#CBD5E1"
              rightColor="#E2E8F0"
              stroke="#475569"
            />
            {/* Meralco Orange Top Cap / Band */}
            <IsoBox
              x={-60.2}
              y={hubBaseY + 10.8}
              z={60}
              dx={42.4}
              dy={40.4}
              dz={6}
              topColor="#FF5A00"
              leftColor="#C2410C"
              rightColor="#EA580C"
              stroke="#9A3412"
            />
            {(() => {
              const meralcoHubLogo = iso(-39, hubBaseY + 31, 67);
              return (
                <g transform={`translate(${meralcoHubLogo.x}, ${meralcoHubLogo.y})`} pointerEvents="none">
                  <circle cx="0" cy="0" r="10.5" fill="#FFFFFF" stroke="#FF5A00" strokeWidth="1.4" />
                  <clipPath id="hubMeralcoClip">
                    <circle cx="0" cy="0" r="9.2" />
                  </clipPath>
                  <image
                    href="/meralco-logo.png"
                    x="-9.5"
                    y="-9.5"
                    width="19"
                    height="19"
                    clipPath="url(#hubMeralcoClip)"
                    preserveAspectRatio="xMidYMid slice"
                  />
                </g>
              );
            })()}

            {/* Box 2: Maynilad Main Water Meter Hub (Lower Box) */}
            <IsoBox
              x={-60}
              y={hubBaseY + 67}
              z={24}
              dx={42}
              dy={40}
              dz={32}
              topColor="#FFFFFF"
              leftColor="#CBD5E1"
              rightColor="#E2E8F0"
              stroke="#475569"
            />
            {/* Maynilad Blue & Green Top Cap / Band */}
            <IsoBox
              x={-60.2}
              y={hubBaseY + 66.8}
              z={51}
              dx={42.4}
              dy={40.4}
              dz={3.5}
              topColor="#0284C7"
              leftColor="#075985"
              rightColor="#0369A1"
              stroke="none"
            />
            <IsoBox
              x={-60.2}
              y={hubBaseY + 66.8}
              z={54.5}
              dx={42.4}
              dy={40.4}
              dz={3.5}
              topColor="#22C55E"
              leftColor="#15803D"
              rightColor="#16A34A"
              stroke="#14532D"
            />
            {(() => {
              const mayniladHubLogo = iso(-39, hubBaseY + 87, 59);
              return (
                <g transform={`translate(${mayniladHubLogo.x}, ${mayniladHubLogo.y})`} pointerEvents="none">
                  <circle cx="0" cy="0" r="10.5" fill="#FFFFFF" stroke="#0284C7" strokeWidth="1.4" />
                  <clipPath id="hubMayniladClip">
                    <circle cx="0" cy="0" r="9.2" />
                  </clipPath>
                  <image
                    href="/maynilad-logo.png"
                    x="-9.5"
                    y="-9.5"
                    width="19"
                    height="19"
                    clipPath="url(#hubMayniladClip)"
                    preserveAspectRatio="xMidYMid slice"
                  />
                </g>
              );
            })()}

            {/* Blended Light-Theme MAIN GRID HUB Header Badge */}
            {(() => {
              const hubLabel = iso(-39, hubBaseY + 31, 90);
              return (
                <g transform={`translate(${hubLabel.x}, ${hubLabel.y})`} pointerEvents="none">
                  <rect
                    x="-54"
                    y="-12"
                    width="108"
                    height="21"
                    rx="10.5"
                    fill="#FFFFFF"
                    stroke="#BFDBFE"
                    strokeWidth="1.4"
                  />
                  <text
                    x="0"
                    y="2"
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="800"
                    letterSpacing="0.06em"
                    fill="#1D4ED8"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    MAIN GRID HUB
                  </text>
                </g>
              );
            })()}
          </g>

          {/* ── 5. ANIMATED POWER & WATER SUB-METER CONDUIT LINES ── */}
          {positionedRooms.map(({ room, rx, ry, rz }) => {
            const roomMeterPt = iso(rx + 25, ry + ROOM_D, rz + 20);
            const midPowerPt = iso(-8, ry + ROOM_D + 8, rz + 12);
            const midWaterPt = iso(-15, ry + ROOM_D + 14, rz + 8);
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

          {/* ── 6. 3D ISOMETRIC ROOM UNITS (Sorted back-to-front so front rows never get overlapped!) ── */}
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
              />
            ))}

          {/* Building Rooftop Sign ("TARIPA RESIDENCES" — Rendered after rooms so it never gets overlapped!) */}
          {(() => {
            const has2ndFloor = positionedRooms.some((r) => r.rz > 30);
            const wallTopZ = has2ndFloor ? 139 : 89;
            const signZ = wallTopZ + 16;
            const signAnchor = iso(START_X + wingWidth / 2, START_Y - 4, signZ);
            const postLeftBase = iso(START_X + wingWidth / 2 - 36, START_Y - 4, wallTopZ);
            const postLeftTop = iso(START_X + wingWidth / 2 - 36, START_Y - 4, signZ - 4);
            const postRightBase = iso(START_X + wingWidth / 2 + 36, START_Y - 4, wallTopZ);
            const postRightTop = iso(START_X + wingWidth / 2 + 36, START_Y - 4, signZ - 4);
            return (
              <g pointerEvents="none">
                <line
                  x1={postLeftBase.x}
                  y1={postLeftBase.y}
                  x2={postLeftTop.x}
                  y2={postLeftTop.y}
                  stroke="#1E3A8A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <line
                  x1={postRightBase.x}
                  y1={postRightBase.y}
                  x2={postRightTop.x}
                  y2={postRightTop.y}
                  stroke="#1E3A8A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <g transform={`translate(${signAnchor.x}, ${signAnchor.y})`}>
                  <rect
                    x="-82"
                    y="-13"
                    width="164"
                    height="24"
                    rx="12"
                    fill="#FFFFFF"
                    stroke="#2563EB"
                    strokeWidth="1.6"
                  />
                  <text
                    x="0"
                    y="2.5"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="800"
                    letterSpacing="0.08em"
                    fill="#1D4ED8"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    TARIPA RESIDENCES
                  </text>
                </g>
              </g>
            );
          })()}

          {/* Front Veranda Pillars (Always positioned at the actual front veranda edge!) */}
          {Array.from({ length: maxCols + 1 }).map((_, idx) => (
            <IsoBox
              key={`pillar-${idx}`}
              x={START_X + idx * ROOM_W - (idx === maxCols ? 6 : 0)}
              y={verandaY + verandaDepth - 6}
              z={28}
              dx={6}
              dy={6}
              dz={46}
              topColor="#93C5FD"
              leftColor="#1E3A8A"
              rightColor="#2563EB"
              stroke="#172554"
            />
          ))}

          {/* ── 7. DYNAMIC LANDSCAPE TREES & DUAL UTILITY TRUCKS (MERALCO & MAYNILAD) ── */}
          <IsoTree x={-55} y={-20} z={19} scale={1.15} />
          <IsoTree x={START_X + wingWidth + 45} y={START_Y + 20} z={19} scale={0.95} />
          <IsoTree x={START_X + wingWidth + 45} y={verandaY - 10} z={19} scale={1.15} />

          {/* ── TRUCK 1: MERALCO ELECTRIC SERVICE TRUCK (Upper Lane) ── */}
          {(() => {
            const meralcoX = START_X - 5;
            const meralcoY = roadY + 4;
            const badgeAnchor = iso(meralcoX + 24, meralcoY + 10, 52);
            const roofLogoPt = iso(meralcoX + 21, meralcoY + 10, 43);
            return (
              <g className="iso-van-meralco" pointerEvents="none">
                {/* Dark Undercarriage / Wheels Shadow */}
                <IsoBox
                  x={meralcoX + 3}
                  y={meralcoY + 2}
                  z={20}
                  dx={54}
                  dy={16}
                  dz={3}
                  topColor="#0F172A"
                  leftColor="#0F172A"
                  rightColor="#1E293B"
                  stroke="none"
                />
                {/* Main Cargo Box (Clean White) */}
                <IsoBox
                  x={meralcoX}
                  y={meralcoY}
                  z={22}
                  dx={44}
                  dy={20}
                  dz={20}
                  topColor="#FFFFFF"
                  leftColor="#E2E8F0"
                  rightColor="#F1F5F9"
                  stroke="#64748B"
                />
                {/* Meralco Signature Orange Stripe */}
                <IsoBox
                  x={meralcoX}
                  y={meralcoY}
                  z={28}
                  dx={44.2}
                  dy={20.4}
                  dz={5}
                  topColor="#FF5A00"
                  leftColor="#C2410C"
                  rightColor="#EA580C"
                  stroke="none"
                />
                {/* Truck Cab (Meralco Orange) */}
                <IsoBox
                  x={meralcoX + 44}
                  y={meralcoY + 1}
                  z={22}
                  dx={16}
                  dy={18}
                  dz={15}
                  topColor="#FB923C"
                  leftColor="#C2410C"
                  rightColor="#EA580C"
                  stroke="#9A3412"
                />
                {/* Windshield Accent */}
                <IsoBox
                  x={meralcoX + 55}
                  y={meralcoY + 2.5}
                  z={28}
                  dx={5.5}
                  dy={15}
                  dz={6}
                  topColor="#BAE6FD"
                  leftColor="#0284C7"
                  rightColor="#38BDF8"
                  stroke="none"
                />
                {/* Meralco Logo Decal on Truck Roof */}
                <g transform={`translate(${roofLogoPt.x}, ${roofLogoPt.y})`}>
                  <circle cx="0" cy="0" r="8.5" fill="#FFFFFF" stroke="#FF5A00" strokeWidth="1" />
                  <image
                    href="/meralco-logo.png"
                    x="-7.5"
                    y="-7.5"
                    width="15"
                    height="15"
                    preserveAspectRatio="xMidYMid meet"
                  />
                </g>
                {/* Floating Meralco Pill Badge Above Truck */}
                <g transform={`translate(${badgeAnchor.x}, ${badgeAnchor.y})`}>
                  <rect
                    x="-44"
                    y="-12"
                    width="88"
                    height="22"
                    rx="11"
                    fill="#FFFFFF"
                    stroke="#FDBA74"
                    strokeWidth="1.3"
                  />
                  <clipPath id="meralcoBadgeClip">
                    <circle cx="-31" cy="-1" r="8" />
                  </clipPath>
                  <image
                    href="/meralco-logo.png"
                    x="-39"
                    y="-9"
                    width="16"
                    height="16"
                    clipPath="url(#meralcoBadgeClip)"
                    preserveAspectRatio="xMidYMid slice"
                  />
                  <text
                    x="6"
                    y="2.5"
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="800"
                    letterSpacing="0.05em"
                    fill="#C2410C"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    MERALCO
                  </text>
                </g>
              </g>
            );
          })()}

          {/* ── TRUCK 2: MAYNILAD WATER SERVICE TRUCK (Lower Lane) ── */}
          {(() => {
            const mayniladX = START_X + Math.max(115, wingWidth - 90);
            const mayniladY = roadY + 26;
            const badgeAnchor = iso(mayniladX + 24, mayniladY + 10, 52);
            const roofLogoPt = iso(mayniladX + 21, mayniladY + 10, 43);
            return (
              <g className="iso-van-maynilad" pointerEvents="none">
                {/* Dark Undercarriage / Wheels Shadow */}
                <IsoBox
                  x={mayniladX + 3}
                  y={mayniladY + 2}
                  z={20}
                  dx={54}
                  dy={16}
                  dz={3}
                  topColor="#0F172A"
                  leftColor="#0F172A"
                  rightColor="#1E293B"
                  stroke="none"
                />
                {/* Main Cargo Box (Clean White) */}
                <IsoBox
                  x={mayniladX}
                  y={mayniladY}
                  z={22}
                  dx={44}
                  dy={20}
                  dz={20}
                  topColor="#FFFFFF"
                  leftColor="#E2E8F0"
                  rightColor="#F1F5F9"
                  stroke="#64748B"
                />
                {/* Maynilad Signature Green & Blue Dual Stripe */}
                <IsoBox
                  x={mayniladX}
                  y={mayniladY}
                  z={30}
                  dx={44.2}
                  dy={20.4}
                  dz={3.5}
                  topColor="#22C55E"
                  leftColor="#15803D"
                  rightColor="#16A34A"
                  stroke="none"
                />
                <IsoBox
                  x={mayniladX}
                  y={mayniladY}
                  z={26.5}
                  dx={44.2}
                  dy={20.4}
                  dz={3.5}
                  topColor="#0284C7"
                  leftColor="#075985"
                  rightColor="#0369A1"
                  stroke="none"
                />
                {/* Truck Cab (Maynilad Deep Blue) */}
                <IsoBox
                  x={mayniladX + 44}
                  y={mayniladY + 1}
                  z={22}
                  dx={16}
                  dy={18}
                  dz={15}
                  topColor="#38BDF8"
                  leftColor="#075985"
                  rightColor="#0284C7"
                  stroke="#0C4A6E"
                />
                {/* Windshield Accent */}
                <IsoBox
                  x={mayniladX + 55}
                  y={mayniladY + 2.5}
                  z={28}
                  dx={5.5}
                  dy={15}
                  dz={6}
                  topColor="#E0F2FE"
                  leftColor="#0369A1"
                  rightColor="#7DD3FC"
                  stroke="none"
                />
                {/* Maynilad Logo Decal on Truck Roof */}
                <g transform={`translate(${roofLogoPt.x}, ${roofLogoPt.y})`}>
                  <circle cx="0" cy="0" r="8.5" fill="#FFFFFF" stroke="#0284C7" strokeWidth="1" />
                  <image
                    href="/maynilad-logo.png"
                    x="-7"
                    y="-7"
                    width="14"
                    height="14"
                    preserveAspectRatio="xMidYMid meet"
                  />
                </g>
                {/* Floating Maynilad Pill Badge Above Truck */}
                <g transform={`translate(${badgeAnchor.x}, ${badgeAnchor.y})`}>
                  <rect
                    x="-46"
                    y="-12"
                    width="92"
                    height="22"
                    rx="11"
                    fill="#FFFFFF"
                    stroke="#7DD3FC"
                    strokeWidth="1.3"
                  />
                  <clipPath id="mayniladBadgeClip">
                    <circle cx="-33" cy="-1" r="8" />
                  </clipPath>
                  <image
                    href="/maynilad-logo.png"
                    x="-41"
                    y="-9"
                    width="16"
                    height="16"
                    clipPath="url(#mayniladBadgeClip)"
                    preserveAspectRatio="xMidYMid slice"
                  />
                  <text
                    x="6"
                    y="2.5"
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="800"
                    letterSpacing="0.05em"
                    fill="#0369A1"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    MAYNILAD
                  </text>
                </g>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TOP-RIGHT FLOATING HUD: SELECTED ROOM INSPECTOR PANEL
      ══════════════════════════════════════════════════════════════════ */}
      {selectedRoom && (
        <div
          className="iso-hud-inspector"
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
                LIVE UNIT TELEMETRY · {roomFloorMap[selectedRoom.id] === 2 ? "2ND FLOOR" : "1ST FLOOR"}
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
        className="iso-hud-bottom-left"
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
              flexShrink: 0,
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

        <div style={{ width: "1px", height: "28px", background: "#CBD5E1", flexShrink: 0 }} />

        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
          {[
            { id: "all", label: `All Floors (${floor1Count + floor2Count})` },
            { id: "1", label: `1st Floor (${floor1Count}/6)` },
            { id: "2", label: `2nd Floor (${floor2Count})` },
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
        className="iso-hud-bottom-right"
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
