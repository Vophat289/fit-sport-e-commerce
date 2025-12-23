import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

export interface Category {
    _id?: string;
    name: string;
    slug?: string;
    description?: string;
    image?: string;
    createdAt?: string;
};
 
@Injectable({
    providedIn: 'root'
})
export class CategoryService{

    private apiUrl = '/api/categories';
    
    constructor(private http: HttpClient){}

    //get danh mục
    getAll(): Observable<Category[]>{
        return this.http.get<Category[]>(this.apiUrl)
    }

    getBySlugCategory(slug: string): Observable<Category[]>{
        return this.http.get<Category[]>(`${this.apiUrl}/${slug}`);
    }

    create(data: Partial<Category>): Observable<Category[]>{
        return this.http.post<Category[]>(this.apiUrl, data);
    }

    createWithFile(formData: FormData): Observable<Category>{
        return this.http.post<Category>(this.apiUrl, formData);
    }

    update(id:string, data: Partial<Category>): Observable<Category>{
        return this.http.post<Category>(`${this.apiUrl}/${id}`, data)
    }

    updateWithFile(id: string, formData: FormData): Observable<Category>{
        return this.http.post<Category>(`${this.apiUrl}/${id}`, formData);
    }

    delete(id: string): Observable<any>{
        return this.http.delete(`${this.apiUrl}/${id}`)
    }
}