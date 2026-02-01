import apiClient from "./apiClient";

export const getUser = async (id: string) => {
  console.log(`Fetching user with ID: ${id}`);
  const response = await apiClient.get(`/user/${id}`);
  console.log(`User data fetched:`, response.data);
  return response.data;
};

export const getUsers = async () => {
  const response = await apiClient.get("/user");
  return response.data;
};

export const createUser = async (data: any) => {
  const response = await apiClient.post("/user", data);
  return response.data;
};

export const updateUser = async (id: string, data: any) => {
  const response = await apiClient.put(`/user/${id}`, data);
  return response.data;
};

export const deleteUser = async (id: string) => {
  const response = await apiClient.delete(`/user/${id}`);
  return response.data;
};

export const loginUser = async (data: any) => {
  const response = await apiClient.post("/auth/login", data);
  return response.data;
};

export const googleSingIn = async (data: any) => {
  const response = await apiClient.post("/auth/google", data);
  return response.data;
};

export const registerUser = async (data: any) => {
  const response = await apiClient.post("/auth/register", data);
  return response.data;
};
