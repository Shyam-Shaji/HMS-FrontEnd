import { useEffect, useRef, useState } from "react";
import { createQueueSocket } from "@/lib/socket";
import { fetchQueueSnapshot } from "./api";
import type { QueueSnapshot } from "./types";

/**
 * Live "you are #4, ~N ahead of you" status for one doctor/date. Fetches
 * an initial REST snapshot (so the screen isn't blank while the socket
 * connects), then joins the matching Socket.io room and replaces the
 * snapshot with every `queue-update` push from the backend - check-ins,
 * consultation start/complete, cancellations all land here in real time.
 */
export function useLiveQueue(hospitalId: string | undefined, doctorId: string | undefined, date: string | undefined) {
    const [queue, setQueue] = useState<QueueSnapshot | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const socketRef = useRef<ReturnType<typeof createQueueSocket> | null>(null);

    useEffect(()=>{
        if(!hospitalId || !doctorId || !date) return;

        let cancelled = false;
        setIsLoading(true);

        fetchQueueSnapshot(doctorId, date)
        .then((snapshot) => {
            if(!cancelled) setQueue(snapshot);
        })
        .catch(()=> undefined)
        .finally(()=> {
            if(!cancelled) setIsLoading(false);
        });

        const socket = createQueueSocket();
        socketRef.current = socket;
        socket.emit('join-queue', {hospitalId, doctorId, date});
        socket.on('queue-update',(snapshot: QueueSnapshot) => setQueue(snapshot));

        return () => {
            cancelled = true;
            socket.emit('join-queue',{hospitalId, doctorId,date});
            socket.disconnect();
        };
    },[hospitalId, doctorId, date]);

    return {queue, isLoading};
}
