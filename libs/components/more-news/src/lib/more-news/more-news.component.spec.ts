import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoreNewsComponent } from './more-news.component';

describe('MoreNewsComponent', () => {
  let component: MoreNewsComponent;
  let fixture: ComponentFixture<MoreNewsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoreNewsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MoreNewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('selects the featured image when the first media item has no image', () => {
    const news = {
      mediaNews: [
        { emphasis: false, imgSize: null },
        { emphasis: true, imgSize: { small: 'featured-small.webp' } },
      ],
    } as any;

    expect((component as any).getImageUrl(news)).toBe('featured-small.webp');
  });
});
