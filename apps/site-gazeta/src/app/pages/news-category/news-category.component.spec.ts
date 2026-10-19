import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NewsCategoryComponent } from './news-category.component';

describe('NewsCategoryComponent', () => {
  let component: NewsCategoryComponent;
  let fixture: ComponentFixture<NewsCategoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsCategoryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NewsCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('selects the featured media when earlier media entries have no image', () => {
    const news = {
      mediaNews: [
        { emphasis: false, imgSize: null },
        {
          emphasis: true,
          imgSize: { original: 'original.webp', medium: 'medium.webp' },
        },
      ],
    } as any;

    expect((component as any).getImageUrl(news)).toBe('medium.webp');
  });
});
