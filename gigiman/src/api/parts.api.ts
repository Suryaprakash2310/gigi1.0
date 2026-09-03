import apiClient from "./client";

export interface Category {
  _id: string;
  domainpartname: string;
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

export interface PartRequest {
  _id: string;
  bookingId: any;
  employeeId: any;
  parts: {
    partName: string;
    quantity: number;
    price: number;
  }[];
  totalCost: number;
  status: string;
}


export const fetchCategories = async (): Promise<CategoriesResponse> => {
  const res = await apiClient.get<CategoriesResponse>("/parts/showCategories", {
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



export const fetchPartRequestById = async (
  requestId: string
): Promise<PartRequest> => {
  const res = await apiClient.get<{ partRequest: PartRequest }>(
    `booking/parts/part-request/${requestId}`
  );

  return res.data.partRequest;
};

export const downloadPartBill = async (requestId: string) => {
  const res = await apiClient.get(`/parts/download-bill/${requestId}`, {
    responseType: 'blob',
  });
  return res.data;
};


// export const requestTool = (data) =>
//   apiClient.post("/parts/request-tool", data);


export const createPartRequest = async (
  bookingId: string,
  parts: any[],
  totalCost: number
) => {
  const res = await apiClient.post("/booking/tool/request", {
    bookingId,
    parts,
    totalCost,
  });
  console.log("++++++++++++Part request response:", res.data);
  return res.data;
};


// export const fetchParts = async ( categoryId: string) => {
//   const res = await apiClient.get("/parts", {
//     params: { jobId:'j111', categoriesId: categoryId },
//   });
//   return res.data;
// };