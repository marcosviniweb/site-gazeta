export interface NewsMedia {
    file?:File;
    id?: number;
    idNews?:number;
    emphasis: boolean;
    imgSize?: size;
    author?: string;
    date?: string;
}

interface size {
    original: string;
    small: string;
    medium: string;
    superSmall: string;
}

