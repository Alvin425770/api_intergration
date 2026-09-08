import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

// MOCK user store — replace with real backend once ready.
// Seeded with a couple of test accounts so login works before anyone registers.
let mockUsers = [
  { id: "u1", name: "Test Landlord", email: "test@landlord.com", password: "password", role: "landlord" },
  { id: "u2", name: "Test Tenant", email: "test@tenant.com", password: "password", role: "tenant" },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, name, email, role: "tenant" | "landlord" }

  const login = (email, password) => {
    const existing = mockUsers.find((u) => u.email === email);

    if (!existing) {
      throw new Error("No account found with that email");
    }

    setUser(existing);
    return existing;
  };

  const register = (name, email, password, role) => {
    if (mockUsers.some((u) => u.email === email)) {
      throw new Error("An account with that email already exists");
    }

    const newUser = { id: Date.now().toString(), name, email, password, role };
    mockUsers.push(newUser);
    return newUser;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);