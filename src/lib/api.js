export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:4100';

const TOKEN_KEY = 'dnd_token';
const USER_ID_KEY = 'dnd_user_id';
const USER_NAME_KEY = 'dnd_user';

const toError = async (response) => {
  let message = `请求失败 (${response.status})`;
  let details;

  try {
    const payload = await response.json();
    message = payload?.message || message;
    details = payload?.details;
  } catch {
    // Ignore JSON parse errors and keep generic message.
  }

  const error = new Error(message);
  error.status = response.status;
  error.details = details;
  return error;
};

const request = async (path, options = {}) => {
  const {
    method = 'GET',
    body,
    auth = true,
    headers = {}
  } = options;

  const token = getAccessToken();
  const mergedHeaders = {
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...headers,
    ...(auth && token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: mergedHeaders,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    throw await toError(response);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY) || '';
export const getCurrentUserId = () => localStorage.getItem(USER_ID_KEY) || '';
export const getCurrentUsername = () => localStorage.getItem(USER_NAME_KEY) || '';

export const hasSession = () => Boolean(getAccessToken());

export const saveSession = (session) => {
  localStorage.setItem(TOKEN_KEY, session.accessToken);
  localStorage.setItem(USER_ID_KEY, session.userId);
  localStorage.setItem(USER_NAME_KEY, session.nickname);
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USER_NAME_KEY);
};

export const loginGuest = (nickname) => {
  return request('/v1/auth/guest-login', {
    method: 'POST',
    auth: false,
    body: { nickname }
  });
};

export const getMe = () => {
  return request('/v1/auth/me');
};

export const getRulesBootstrap = () => {
  return request('/v1/rules/bootstrap', { auth: false });
};

export const listCharacters = () => {
  return request('/v1/characters');
};

export const createCharacter = (payload) => {
  return request('/v1/characters', {
    method: 'POST',
    body: payload
  });
};

export const updateCharacter = (characterId, payload) => {
  return request(`/v1/characters/${characterId}`, {
    method: 'PATCH',
    body: payload
  });
};

export const deleteCharacter = (characterId) => {
  return request(`/v1/characters/${characterId}`, {
    method: 'DELETE'
  });
};

export const createRoom = (payload) => {
  return request('/v1/rooms', {
    method: 'POST',
    body: payload
  });
};

export const joinRoom = (roomId, password = '') => {
  return request(`/v1/rooms/${String(roomId).toUpperCase()}/join`, {
    method: 'POST',
    body: { password }
  });
};

export const leaveRoom = (roomId) => {
  return request(`/v1/rooms/${String(roomId).toUpperCase()}/leave`, {
    method: 'POST',
    body: {}
  });
};

export const getRoom = (roomId) => {
  return request(`/v1/rooms/${String(roomId).toUpperCase()}`);
};

export const setRoomReady = (roomId, payload) => {
  return request(`/v1/rooms/${String(roomId).toUpperCase()}/ready`, {
    method: 'POST',
    body: payload
  });
};

export const startRoom = (roomId, payload = {}) => {
  return request(`/v1/rooms/${String(roomId).toUpperCase()}/start`, {
    method: 'POST',
    body: payload
  });
};

export const listRoomMessages = (roomId, afterSeq = 0, limit = 100) => {
  return request(
    `/v1/rooms/${String(roomId).toUpperCase()}/messages?afterSeq=${afterSeq}&limit=${limit}`
  );
};

export const submitRoomAction = (roomId, content) => {
  return request(`/v1/rooms/${String(roomId).toUpperCase()}/actions`, {
    method: 'POST',
    body: { content }
  });
};

export const startCombat = (roomId, participantIds) => {
  return request(`/v1/rooms/${String(roomId).toUpperCase()}/combat/start`, {
    method: 'POST',
    body: { participantIds }
  });
};

export const nextCombatTurn = (roomId) => {
  return request(`/v1/rooms/${String(roomId).toUpperCase()}/combat/next-turn`, {
    method: 'POST',
    body: {}
  });
};

export const applyDamage = (roomId, combatantId, amount, type) => {
  return request(`/v1/rooms/${String(roomId).toUpperCase()}/combat/damage`, {
    method: 'POST',
    body: { combatantId, amount, type }
  });
};

export const healCombatant = (roomId, combatantId, amount) => {
  return request(`/v1/rooms/${String(roomId).toUpperCase()}/combat/heal`, {
    method: 'POST',
    body: { combatantId, amount }
  });
};

export const endCombat = (roomId) => {
  return request(`/v1/rooms/${String(roomId).toUpperCase()}/combat/end`, {
    method: 'POST',
    body: {}
  });
};

export const initGrid = (roomId, width, height) => {
  return request(`/v1/rooms/${String(roomId).toUpperCase()}/grid/init`, {
    method: 'POST',
    body: { width, height }
  });
};

export const moveToken = (roomId, tokenId, x, y) => {
  return request(`/v1/rooms/${String(roomId).toUpperCase()}/grid/move`, {
    method: 'POST',
    body: { tokenId, x, y }
  });
};

export const addGridToken = (roomId, token) => {
  return request(`/v1/rooms/${String(roomId).toUpperCase()}/grid/token`, {
    method: 'POST',
    body: token
  });
};

export const removeGridToken = (roomId, tokenId) => {
  return request(`/v1/rooms/${String(roomId).toUpperCase()}/grid/token/${tokenId}`, {
    method: 'DELETE'
  });
};

export const aiDraftCharacter = (prompt) => {
  return request('/v1/characters/ai-draft', {
    method: 'POST',
    body: { prompt }
  });
};
