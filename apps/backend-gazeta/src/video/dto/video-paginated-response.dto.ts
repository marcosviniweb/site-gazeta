import { ApiProperty } from '@nestjs/swagger';
import { VideoResponseDto } from './video-response.dto';

export class VideoPaginatedMeta {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  lastPage: number;
}

export class VideoPaginatedResponse {
  @ApiProperty({ type: [VideoResponseDto] })
  data: VideoResponseDto[];

  @ApiProperty({ type: VideoPaginatedMeta })
  meta: VideoPaginatedMeta;
}
