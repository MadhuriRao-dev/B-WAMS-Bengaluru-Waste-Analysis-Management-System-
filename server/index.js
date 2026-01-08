const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
// IMPORTANT: Replace with valid serviceAccountKey.json in production/local testing
let serviceAccount;
try {
    serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin Initialized");
} catch (error) {
    console.error("Failed to load serviceAccountKey.json. Please ensure it exists.");
    process.exit(1);
}

const db = admin.firestore();

// Configuration
const THRESHOLD_METERS = parseInt(process.env.THRESHOLD_METERS || '10000');
const EARTH_RADIUS = 6371000; // meters

/**
 * Calculates the shortest distance from point P to line segment AB.
 * Projection: Simple equirectangular approximation (accurate enough for city scale).
 * 
 * @param {Object} P Point {lat, lng} (The complaint location)
 * @param {Object} A Start of segment {lat, lng} (Worker route source)
 * @param {Object} B End of segment {lat, lng} (Worker route destination)
 * @returns {number} Distance in meters
 */
function distancePointToSegmentMeters(P, A, B) {
    // Convert lat/lng to radians
    const toRad = x => x * Math.PI / 180;
    const latP = toRad(P.lat), lonP = toRad(P.lng);
    const latA = toRad(A.lat), lonA = toRad(A.lng);
    const latB = toRad(B.lat), lonB = toRad(B.lng);

    // We project to a flat plane using the average latitude of the segment to scale longitude
    // x = longitude * cos(avgLat) * EARTH_RADIUS
    // y = latitude * EARTH_RADIUS

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

    // Vector AB
    const dx = b.x - a.x;
    const dy = b.y - a.y;

    if (dx === 0 && dy === 0) {
        // A and B are the same point
        return Math.hypot(p.x - a.x, p.y - a.y);
    }

    // Project point p onto line spanning AB, finding parameter t
    // t = ((px - ax) * dx + (py - ay) * dy) / (dx^2 + dy^2)
    const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);

    // Clamp t to segment [0, 1]
    const tClamped = Math.max(0, Math.min(1, t));

    // Find closest point on segment
    const closestX = a.x + tClamped * dx;
    const closestY = a.y + tClamped * dy;

    // Distance from p to closest point
    return Math.hypot(p.x - closestX, p.y - closestY);
}


/**
 * POST /assign-task
 * Headers: Authorization: Bearer <ID_TOKEN>
 * Body: { complaintId, location: { lat, lng } }
 */
app.post('/assign-task', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;

    try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
        console.error("Token verification failed:", error);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    const { complaintId, location } = req.body;

    if (!complaintId || !location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
        return res.status(400).json({ error: 'Invalid body. Expected complaintId and location {lat, lng}' });
    }

    try {
        // 1. Check if complaint exists and is unassigned
        const complaintRef = db.collection('complaints').doc(complaintId);
        const complaintSnap = await complaintRef.get();

        if (!complaintSnap.exists) {
            return res.status(404).json({ error: 'Complaint not found' });
        }

        const complaintData = complaintSnap.data();
        if (complaintData.assignedTo) {
            // Idempotency: If already assigned, just return current assignment
            return res.status(200).json({
                message: 'Already assigned',
                assignedTo: complaintData.assignedTo,
                assignedName: complaintData.assignedName
            });
        }

        // 2. Find eligible workers
        const workersSnap = await db.collection('users')
            .where('role', '==', 'worker')
            .get();

        const candidates = [];
        workersSnap.forEach(doc => {
            const worker = doc.data();
            if (worker.route && worker.route.source && worker.route.destination) {
                // Validation of lat/lng
                if (worker.route.source.lat && worker.route.destination.lat) {
                    candidates.push({ id: doc.id, ...worker });
                }
            }
        });

        // 3. Find closest worker
        let bestWorker = null;
        let minDistance = Infinity;

        for (const worker of candidates) {
            const dist = distancePointToSegmentMeters(
                location,
                worker.route.source,
                worker.route.destination
            );

            console.log(`Worker ${worker.name || worker.id} distance: ${dist.toFixed(2)}m`);

            if (dist < minDistance) {
                minDistance = dist;
                bestWorker = worker;
            }
        }

        const updates = {
            assignedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        let responseData = {};

        if (bestWorker && minDistance <= THRESHOLD_METERS) {
            updates.assignedTo = bestWorker.id;
            updates.assignedDistance = minDistance;
            updates.assignedName = bestWorker.name || 'Unknown Worker';
            updates.status = 'Assigned'; // Optional status update

            responseData = {
                status: 'assigned',
                workerName: updates.assignedName,
                distance: minDistance
            };
            console.log(`Assigned to ${updates.assignedName} (${minDistance.toFixed(2)}m)`);

        } else {
            updates.assignedTo = null; // Ensuring it's explicit
            updates.assignedDistance = minDistance === Infinity ? null : minDistance;
            updates.assignmentNote = minDistance > THRESHOLD_METERS
                ? `Closest worker was ${minDistance.toFixed(0)}m away (Threshold: ${THRESHOLD_METERS}m)`
                : 'No workers with valid routes found';

            responseData = {
                status: 'unassigned',
                message: updates.assignmentNote
            };
            console.log(`Failed to assign: ${updates.assignmentNote}`);
        }

        // 4. Update Firestore
        await complaintRef.update(updates);

        return res.status(200).json(responseData);

    } catch (error) {
        console.error("Assignment error:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Backend service running on port ${PORT}`);
});
