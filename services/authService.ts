import type { User } from '../types';

const USERS_STORAGE_KEY = 'beautyflow_users';
const SESSION_STORAGE_KEY = 'beautyflow_session';

/**
 * Retrieves all users from localStorage.
 * @returns {User[]} An array of user objects.
 */
const getUsers = (): User[] => {
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
};

/**
 * Saves an array of users to localStorage.
 * @param {User[]} users - The array of users to save.
 */
const saveUsers = (users: User[]): void => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

/**
 * Initializes the user database. If no users exist, it creates the 'BOSS' super user.
 * This ensures the application always has an administrator account on first run.
 */
export const init = (): void => {
    const users = getUsers();
    if (users.length === 0) {
        const bossUser: User = {
            id: `user-${Date.now()}`,
            username: 'BOSS',
            password: 'teste', // In a real app, this should be hashed.
            isBoss: true,
        };
        saveUsers([bossUser]);
        console.log('BOSS user created.');
    }
};

/**
 * Registers a new user.
 * @param {string} username - The desired username.
 * @param {string} password - The desired password.
 * @returns {Promise<User>} The newly created user object.
 * @throws {Error} If the username already exists.
 */
export const register = async (username: string, password: string): Promise<User> => {
    const users = getUsers();
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        throw new Error('Username already exists.');
    }
    const newUser: User = {
        id: `user-${Date.now()}`,
        username,
        password, // Again, hashing is crucial in a real scenario.
    };
    saveUsers([...users, newUser]);
    return newUser;
};

/**
 * Logs in a user.
 * @param {string} username - The user's username.
 * @param {string} password - The user's password.
 * @returns {Promise<User>} The logged-in user object.
 * @throws {Error} If credentials are invalid.
 */
export const login = async (username: string, password: string): Promise<User> => {
    const users = getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (!user) {
        throw new Error('Invalid username or password.');
    }
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    return user;
};

/**
 * Logs out the current user by clearing the session.
 */
export const logout = (): void => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
};

/**
 * Gets the currently logged-in user from the session.
 * @returns {User | null} The current user or null if not logged in.
 */
export const getCurrentUser = (): User | null => {
    const userJson = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return userJson ? JSON.parse(userJson) : null;
};

/**
 * Updates a user's profile information.
 * @param {string} userId - The ID of the user to update.
 * @param {string} newUsername - The new username.
 * @param {string} newPassword - The new password (optional).
 * @returns {Promise<User>} The updated user object.
 * @throws {Error} If the new username is taken by another user.
 */
export const updateUser = async (userId: string, newUsername: string, newPassword?: string): Promise<User> => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        throw new Error('User not found.');
    }

    // Check if the new username is already taken by another user.
    if (users.some(u => u.username.toLowerCase() === newUsername.toLowerCase() && u.id !== userId)) {
        throw new Error('This username is already taken.');
    }

    const updatedUser = { ...users[userIndex] };
    updatedUser.username = newUsername;
    if (newPassword) {
        updatedUser.password = newPassword;
    }

    users[userIndex] = updatedUser;
    saveUsers(users);
    
    // Update the session if the current user is the one being updated
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedUser));
    }

    return updatedUser;
};
