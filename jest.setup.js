// Mock Firestore with in-memory beans for integration tests
let beansStore = [];
let snapshotCallbacks = [];

vi.mock('firebase/firestore', () => ({
	collection: vi.fn(() => ({})),
	query: vi.fn((ref) => ref),
	orderBy: vi.fn(() => {}),
	onSnapshot: vi.fn((q, cb) => {
		snapshotCallbacks.push(cb);
		cb({ docs: beansStore.map((bean) => ({ id: bean.id, data: () => bean })) });
		return () => {};
	}),
}));

vi.mock('@/lib/firestore', () => ({
	addBean: vi.fn(async (bean) => {
		const newBean = { ...bean, id: Math.random().toString(36).slice(2) };
		beansStore.push(newBean);
		setTimeout(() => {
			snapshotCallbacks.forEach(cb => cb({ docs: beansStore.map((b) => ({ id: b.id, data: () => b })) }));
		}, 0);
		return { id: newBean.id };
	}),
	updateBean: vi.fn(async (id, updates) => {
		beansStore = beansStore.map((b) => b.id === id ? { ...b, ...updates } : b);
		setTimeout(() => {
			snapshotCallbacks.forEach(cb => cb({ docs: beansStore.map((b) => ({ id: b.id, data: () => b })) }));
		}, 0);
	}),
	deleteBean: vi.fn(async (id) => {
		beansStore = beansStore.filter((b) => b.id !== id);
		setTimeout(() => {
			snapshotCallbacks.forEach(cb => cb({ docs: beansStore.map((b) => ({ id: b.id, data: () => b })) }));
		}, 0);
	}),
}));

export function setupMocks() {
	beansStore = [];
	snapshotCallbacks = [];
}
// (Removed duplicate Firestore mock here; only the async in-memory mock above is used)
import '@testing-library/jest-dom';
import 'dotenv/config';
require('whatwg-fetch');

// Mock firebase-config.ts for all tests
vi.mock('@/firebase-config', () => ({
	app: {},
	auth: { currentUser: { uid: 'test-user' } },
	db: {},
}));
