import apiClient from "./client";

export interface Category {
  _id: string;
  domaintoolname: string;
}

export interface CategoriesResponse {
  success: boolean;
  total: number;
  categories: Category[];
}
interface Part {
  partsname: string;
  price: number;
}

interface PartsApiResponse {
  success: boolean;
  jobId: string;
  category: string;
  totlaparts: number;
  parts: Part[];
}

export const fetchCategories = async (): Promise<CategoriesResponse> => {
  const res = await apiClient.get<CategoriesResponse>("/parts/categories", {
    //params: { jobId },
  });
  return res.data;
};

export const fetchParts = async (jobId: string, categoryId: string): Promise<PartsApiResponse> => {
  const res = await apiClient.get<PartsApiResponse>("/parts/showparts", {
    params: { jobId, categoriesId: categoryId },
  });
  return res.data;
};



// export const fetchParts = async ( categoryId: string) => {
//   const res = await apiClient.get("/parts", {
//     params: { jobId:'j111', categoriesId: categoryId },
//   });
//   return res.data;
// };