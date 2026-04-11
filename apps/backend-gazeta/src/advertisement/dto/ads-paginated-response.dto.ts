import { ApiProperty } from '@nestjs/swagger';
import { AdvertisementResponseDto } from './advertisement-response.dto';

export class AdsPaginatedMeta {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  lastPage: number;
}

export class AdsPaginatedResponse {
  @ApiProperty({ type: [AdvertisementResponseDto] })
  data: AdvertisementResponseDto[];

  @ApiProperty({ type: AdsPaginatedMeta })
  meta: AdsPaginatedMeta;
}
