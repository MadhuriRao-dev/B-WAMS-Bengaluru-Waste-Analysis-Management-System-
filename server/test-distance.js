
const EARTH_RADIUS = 6371000; // meters

/**
 * Calculates the shortest distance from point P to line segment AB.
 * (Copied from index.js for verification)
 */
function distancePointToSegmentMeters(P, A, B) {
    const toRad = x => x * Math.PI / 180;
    const latP = toRad(P.lat), lonP = toRad(P.lng);
    const latA = toRad(A.lat), lonA = toRad(A.lng);
    const latB = toRad(B.lat), lonB = toRad(B.lng);

    const avgLat = (latA + latB) / 2;
    const cosLat = Math.cos(avgLat);

    function project(lat, lon) {
        return {
            x: lon * cosLat * EARTH_RADIUS,
            y: lat * EARTH_RADIUS
        };
    }

    const p = project(latP, lonP);
    const a = project(latA, lonA);
    const b = project(latB, lonB);

    const dx = b.x - a.x;
    const dy = b.y - a.y;

    if (dx === 0 && dy === 0) {
        return Math.hypot(p.x - a.x, p.y - a.y);
    }

    const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
    const tClamped = Math.max(0, Math.min(1, t));

    const closestX = a.x + tClamped * dx;
    const closestY = a.y + tClamped * dy;

    return Math.hypot(p.x - closestX, p.y - closestY);
}

// Test Cases
const workerRoute = {
    source: { lat: 12.9716, lng: 77.5946 }, // Bangalore Area
    destination: { lat: 12.9352, lng: 77.6245 }
};

const complaintNear = { lat: 12.95, lng: 77.61 }; // Roughly between source/dest
const complaintFar = { lat: 13.00, lng: 77.50 }; // Far away

console.log("--- Testing Distance Logic ---");

const d1 = distancePointToSegmentMeters(complaintNear, workerRoute.source, workerRoute.destination);
console.log(`Distance to Near Complaint: ${d1.toFixed(2)}m`);
// Expected: A few hundred/thousand meters, definitely < 10000

const d2 = distancePointToSegmentMeters(complaintFar, workerRoute.source, workerRoute.destination);
console.log(`Distance to Far Complaint: ${d2.toFixed(2)}m`);
// Expected: > 10000m

if (d1 < 10000 && d2 > 10000) {
    console.log("✅ simple Logic PASS");
} else {
    console.error("❌ Logic FAIL");
}
