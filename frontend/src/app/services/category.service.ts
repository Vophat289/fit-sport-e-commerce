import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

export interface Category {
    _id?: string;
    name: string;
    slug?: string;
    description?: string;
    createdAt?: string;
};

@Injectable({
    providedIn: 'root'
})
export class CategoryService{

    private apiUrl = 'http://locaclhost:3000/api/categories';

    constructor(private http: HttpClient){}

    //get danh mục
    getAllCategories(): Observable<Category[]>{
        return this.http.get<Category[]>(this.apiUrl)
    }

    getBySlugCategory(slug: string): Observable<Category[]>{
        return this.http.get<Category[]>(`${this.apiUrl}/${slug}`);
    }

    createCategory(data: Partial<Category>): Observable<Category[]>{
        return this.http.post<Category[]>(this.apiUrl, data);
    }

    updateCategory(id:string, data: Partial<Category>): Observable<Category>{
        return this.http.post<Category>(`${this.apiUrl}/${id}`, data)
    }

    deleteCategory(id: string): Observable<any>{
        return this.http.delete(`${this.apiUrl}/${id}`)
    }
}