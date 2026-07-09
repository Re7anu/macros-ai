import { state } from './state.js';
import { setBackendOnline } from './ui.js';

export async function checkBackendHealth() {
    try {
        const response = await fetch(`${state.backendUrl}/api/health`);
        const data = await response.json();
        if (data.status === 'healthy') {
            setBackendOnline(true);
        } else {
            setBackendOnline(false);
        }
    } catch (err) {
        setBackendOnline(false);
    }
}
