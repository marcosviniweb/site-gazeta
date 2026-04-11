export interface Menu {
    id?: number;
    order?: number;
    name: string;
    icon?: string;
    type?: string;
    slug?: string;
    routerLink?: string;
    externalLink?: string;
    parentId?: number;
    createdAt?: string;
    updatedAt?: string;
    children?: Menu[];
    router?: string;
}

