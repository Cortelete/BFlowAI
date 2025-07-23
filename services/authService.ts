import type { User } from '../types';

const USERS_STORAGE_KEY = 'beautyflow_users';
const SESSION_STORAGE_KEY = 'beautyflow_session';

const defaultUserFields: Omit<User, 'id' | 'username' | 'password' | 'isBoss'> = {
    photo: '',
    fullName: '',
    displayName: '',
    userType: 'Cliente',
    gender: 'Prefiro não dizer',
    birthDate: '',
    cpf: '',
    rg: '',
    email: '',
    altEmail: '',
    phone: '',
    fixedPhone: '',
    whatsapp: '',
    instagram: '',
    facebook: '',
    linkedin: '',
    tiktok: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    country: 'Brasil',
    role: '',
    specialty: '',
    bio: '',
};

/**
 * Retrieves all users from localStorage.
 * @returns {Promise<User[]>} A promise that resolves to an array of user objects.
 */
const getUsers = async (): Promise<User[]> => {
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
    return Promise.resolve(usersJson ? JSON.parse(usersJson) : []);
};

/**
 * Saves an array of users to localStorage.
 * @param {User[]} users - The array of users to save.
 * @returns {Promise<void>}
 */
const saveUsers = async (users: User[]): Promise<void> => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return Promise.resolve();
};

/**
 * Initializes the user database. If no users exist, it creates the 'BOSS' super user and other sample users.
 * This ensures the application always has accounts on first run.
 */
export const init = async (): Promise<void> => {
    let users = await getUsers();
    if (users.length === 0) {
        const bossUser: User = {
            ...defaultUserFields,
            id: `user-boss-joyci`,
            username: 'BOSS',
            password: 'teste', // In a real app, this should be hashed.
            isBoss: true,
            userType: 'Administrador',
            fullName: 'Joyci Almeida',
            displayName: 'Joy',
            email: 'luxury.joycialmeida@gmail.com',
            phone: '42999722942',
            whatsapp: '5542999722942',
            instagram: '@luxury.joycialmeida',
            birthDate: '1993-11-05',
            gender: 'Feminino',
            role: 'CEO & Founder',
            specialty: 'Master Lash Designer'
        };
        
        const otherUsers: User[] = [
            // Funcionários
            {...defaultUserFields, id: 'user-func-1', username: 'ana_lima', password: '123', userType: 'Funcionário', fullName: 'Ana Lima', role: 'Esteticista', specialty: 'Limpeza de Pele'},
            {...defaultUserFields, id: 'user-func-2', username: 'bruno_costa', password: '123', userType: 'Funcionário', fullName: 'Bruno Costa', role: 'Massoterapeuta', specialty: 'Massagem Relaxante'},
            // Secretarias
            {...defaultUserFields, id: 'user-sec-1', username: 'fernanda_souza', password: '123', userType: 'Secretaria', fullName: 'Fernanda Souza', role: 'Recepcionista', specialty: 'Agendamentos'},
            {...defaultUserFields, id: 'user-sec-2', username: 'lucas_pereira', password: '123', userType: 'Secretaria', fullName: 'Lucas Pereira', role: 'Auxiliar Administrativo', specialty: 'Financeiro'},
            // Profissionais Lash
            {...defaultUserFields, id: 'user-lash-1', username: 'camila_rocha', password: '123', userType: 'Profissional Lash', fullName: 'Camila Rocha', role: 'Lash Designer', specialty: 'Volume Russo'},
            {...defaultUserFields, id: 'user-lash-2', username: 'mariana_gomes', password: '123', userType: 'Profissional Lash', fullName: 'Mariana Gomes', role: 'Lash Designer', specialty: 'Fio a Fio'},
            // Clientes
            {...defaultUserFields, id: 'user-cli-1', username: 'patricia_oliveira', password: '123', userType: 'Cliente', fullName: 'Patricia Oliveira'},
            {...defaultUserFields, id: 'user-cli-2', username: 'roberto_alves', password: '123', userType: 'Cliente', fullName: 'Roberto Alves'},
        ]
        
        users = [bossUser, ...otherUsers];
        await saveUsers(users);
        console.log('Default users created.');
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
    const users = await getUsers();
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        throw new Error('Username already exists.');
    }
    const newUser: User = {
        ...defaultUserFields,
        id: `user-${Date.now()}`,
        username,
        password, // Again, hashing is crucial in a real scenario.
        fullName: username,
    };
    await saveUsers([...users, newUser]);
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
    const users = await getUsers();
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
export const logout = async (): Promise<void> => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return Promise.resolve();
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
 * @param {Partial<User>} updates - An object containing the fields to update.
 * @returns {Promise<User>} The updated user object.
 * @throws {Error} If the new username is taken by another user.
 */
export const updateUser = async (userId: string, updates: Partial<User>): Promise<User> => {
    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        throw new Error('User not found.');
    }

    // Check if the new username is already taken by another user.
    if (updates.username && users.some(u => u.username.toLowerCase() === updates.username!.toLowerCase() && u.id !== userId)) {
        throw new Error('This username is already taken.');
    }

    const currentUserData = users[userIndex];
    // Merge updates, but handle password carefully
    const { password, ...otherUpdates } = updates;
    const updatedUser = { ...currentUserData, ...otherUpdates };
    
    if (password) { // Only update password if a new one is provided
        updatedUser.password = password;
    }

    users[userIndex] = updatedUser;
    await saveUsers(users);
    
    // Update the session if the current user is the one being updated
    const currentUserInSession = getCurrentUser();
    if (currentUserInSession && currentUserInSession.id === userId) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedUser));
    }

    return updatedUser;
};