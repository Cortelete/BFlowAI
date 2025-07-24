
import type { User, Client, Appointment } from '../types';
import { createEmptyAppointment, saveClients, emptyAnamnesisRecord } from './clientService';

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
 * Retrieves ALL users from localStorage. For admin use only.
 * @returns {Promise<User[]>} A promise that resolves to an array of all user objects.
 */
export const getAllUsers = async (): Promise<User[]> => {
    return getUsers();
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
 * Initializes the user database. If no users exist, it creates the 'BOSS' super user, other sample users,
 * and sample clients for the BOSS user. This ensures the application always has accounts and data on first run.
 */
export const init = async (): Promise<void> => {
    let users = await getUsers();
    if (users.length === 0) {
        // 1. Create the BOSS user
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

        // 2. Create other sample users
        const otherUsers: User[] = [
            {...defaultUserFields, id: 'user-func-1', username: 'ana_lima', password: '123', userType: 'Funcionário', fullName: 'Ana Lima', role: 'Esteticista', specialty: 'Limpeza de Pele'},
            {...defaultUserFields, id: 'user-lash-1', username: 'camila_rocha', password: '123', userType: 'Profissional Lash', fullName: 'Camila Rocha', role: 'Lash Designer', specialty: 'Volume Russo'},
            {...defaultUserFields, id: 'user-cli-1', username: 'patricia_oliveira', password: '123', userType: 'Cliente', fullName: 'Patricia Oliveira'},
        ];
        
        users = [bossUser, ...otherUsers];
        await saveUsers(users);
        console.log('Usuários padrão criados.');

        // 3. Create sample clients for the BOSS user
        const today = new Date();
        const oneMonthAgo = new Date(new Date().setMonth(today.getMonth() - 1)).toISOString().split('T')[0];
        const twoMonthsAgo = new Date(new Date().setMonth(today.getMonth() - 2)).toISOString().split('T')[0];
        const threeMonthsAgo = new Date(new Date().setMonth(today.getMonth() - 3)).toISOString().split('T')[0];

        const sampleAppointments: Appointment[] = [
            {...createEmptyAppointment(twoMonthsAgo), id: 'appt-1', procedureName: 'Extensão de Cílios - Volume Russo', value: 280, price: 280, finalValue: 280, cost: 45, status: 'Pago'},
            {...createEmptyAppointment(oneMonthAgo), id: 'appt-2', procedureName: 'Manutenção Volume Russo', procedure: 'Manutenção Volume Russo', value: 150, price: 150, finalValue: 150, cost: 20, status: 'Pago'},
        ];
        
        const sampleClients: Client[] = [
            {
                id: `client-boss-1`, name: 'Lara Campos', phone: '11987654321', email: 'lara.campos@email.com',
                photo: `https://i.pravatar.cc/150?u=lara`, birthDate: '1995-08-15', tags: ['VIP', 'Recorrente'],
                appointments: sampleAppointments, anamnesis: { ...emptyAnamnesisRecord, healthHistory: { ...emptyAnamnesisRecord.healthHistory, hypertension: true } }
            },
            {
                id: `client-boss-2`, name: 'Sofia Pereira', phone: '21912345678', email: 'sofia.pereira@email.com',
                photo: `https://i.pravatar.cc/150?u=sofia`, birthDate: '2001-03-22', tags: ['Alérgica'],
                appointments: [{...createEmptyAppointment(oneMonthAgo), id: 'appt-3', procedureName: 'Lash Lifting com Coloração', value: 150, price: 150, finalValue: 150, cost: 20, status: 'Pendente'}],
                anamnesis: { ...emptyAnamnesisRecord, allergies: { ...emptyAnamnesisRecord.allergies, lashGlue: true } }
            },
            {
                id: `client-boss-3`, name: 'Beatriz Costa', phone: '31998761234', email: 'beatriz.costa@email.com',
                photo: `https://i.pravatar.cc/150?u=beatriz`, birthDate: '1989-11-10', tags: ['Inativa'],
                appointments: [{...createEmptyAppointment(threeMonthsAgo), id: 'appt-4', procedureName: 'Design de Sobrancelhas com Henna', value: 70, price: 70, finalValue: 70, cost: 10, status: 'Pago'}],
                anamnesis: emptyAnamnesisRecord
            },
             {
                id: `client-boss-4`, name: 'Isabela Martins', phone: '41988552211', email: 'isabela.martins@email.com',
                photo: `https://i.pravatar.cc/150?u=isabela`, birthDate: '1999-07-02', tags: ['Nova Cliente'],
                appointments: [], anamnesis: emptyAnamnesisRecord
            }
        ];

        // Save these clients specifically for the boss user
        await saveClients(bossUser.id, sampleClients);
        console.log('Clientes de exemplo criadas para o usuário BOSS.');
    }
};

/**
 * Registers a new user via the admin panel.
 * @param {Partial<User>} userData - The data for the new user. Must include username and password.
 * @returns {Promise<User>} The newly created user object.
 * @throws {Error} If the username already exists.
 */
export const adminAddUser = async (userData: Partial<User>): Promise<User> => {
    if (!userData.username || !userData.password) {
        throw new Error('Nome de usuário e senha são necessários.');
    }
    const users = await getUsers();
    if (users.some(u => u.username.toLowerCase() === userData.username!.toLowerCase())) {
        throw new Error('Nome de usuário já existe.');
    }
    const newUser: User = {
        ...defaultUserFields,
        ...userData,
        id: `user-${Date.now()}`,
        username: userData.username,
        password: userData.password, // Hashing needed in real app
        fullName: userData.fullName || userData.username,
    };
    await saveUsers([...users, newUser]);
    return newUser;
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
        throw new Error('Nome de usuário já existe.');
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
        throw new Error('Usuário ou senha inválidos.');
    }
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    return user;
};


/**
 * Deletes a user by their ID. Also cleans up their associated data.
 * @param {string} userId - The ID of the user to delete.
 * @returns {Promise<void>}
 * @throws {Error} If trying to delete the BOSS user or user not found.
 */
export const deleteUser = async (userId: string): Promise<void> => {
    let users = await getUsers();
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) {
        throw new Error('Usuário não encontrado.');
    }
    if (userToDelete.isBoss) {
        throw new Error('O usuário administrador principal não pode ser excluído.');
    }
    const updatedUsers = users.filter(u => u.id !== userId);
    await saveUsers(updatedUsers);

    // Also remove their data from localStorage
    localStorage.removeItem(`beautyflow_clients_${userId}`);
    localStorage.removeItem(`beautyflow_procedures_${userId}`);
    localStorage.removeItem(`beautyflow_expenses_${userId}`);

    return Promise.resolve();
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
        throw new Error('Usuário não encontrado.');
    }

    // Check if the new username is already taken by another user.
    if (updates.username && users.some(u => u.username.toLowerCase() === updates.username!.toLowerCase() && u.id !== userId)) {
        throw new Error('Este nome de usuário já está em uso.');
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
