export interface CreatePropertyPayload {
  title: string;
  description?: string;
  price: number;
  location: string;
  propertyType: string;
  amenities?: string[];
  images?: string[];
  categoryId?: string;
}

export interface PropertyFilters {
  location?: string;
  minPrice?: string;
  maxPrice?: string;
  propertyType?: string;
  categoryId?: string;
  amenities?: string;
  page?: string;
  limit?: string;
}
