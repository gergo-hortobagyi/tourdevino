import { IsIn } from 'class-validator';

export class ModerateReviewDto {
  @IsIn(['REMOVE'])
  action!: 'REMOVE';
}
