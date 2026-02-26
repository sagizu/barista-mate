// Mock Firestore with in-memory beans for integration tests
let beansStore = [];
let snapshotCallbacks = [];
let privateRoastersStore = ['Private Roaster 1'];

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
    getPrivateRoasters: vi.fn(async () => privateRoastersStore),
    addPrivateRoaster: vi.fn(async (name) => {
        privateRoastersStore.push(name);
    }),
    deletePrivateRoaster: vi.fn(async (name) => {
        privateRoastersStore = privateRoastersStore.filter(r => r !== name);
    }),
    getBeansByRoaster: vi.fn(async (name) => {
        return beansStore.filter(b => b.roasterName === name);
    }),
}));

export function setupMocks() {
	beansStore = [];
	snapshotCallbacks = [];
    privateRoastersStore = ['Private Roaster 1'];
}

import '@testing-library/jest-dom';
import 'dotenv/config';
require('whatwg-fetch');

// Mock ResizeObserver for Vitest/JSDOM
const ResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));
vi.stubGlobal('ResizeObserver', ResizeObserver);

// Mock scrollIntoView for Vitest/JSDOM
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock auth hook
vi.mock('react-firebase-hooks/auth', () => ({
    useAuthState: vi.fn(() => [{ uid: 'test-user' }, false, undefined]),
}));

// Mock firebase-config to provide auth object for firestore calls
vi.mock('@/firebase-config', () => ({
	app: {},
	auth: { currentUser: { uid: 'test-user' } },
	db: {},
}));


export const mockActiveBean = {
  id: 'active-bean-id',
  beanName: 'Active Bean',
  roasterName: 'Active Roastery',
  grindSetting: '1.2',
  createdAt: new Date().toISOString(),
};
