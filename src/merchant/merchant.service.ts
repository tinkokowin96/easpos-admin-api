import { BadRequestException, Inject } from '@nestjs/common';
import { Document } from 'mongoose';
import {
   CreateMerchantDto,
   MerchantServiceMethods,
   MerchantVerifyDto,
} from '@common/dto/merchant.dto';
import { REPOSITORY } from '@common/constant';
import { FindByIdDto } from '@common/dto/core.dto';
import { EStatus } from '@common/utils/enum';
import { $dayjs } from '@common/utils/datetime';
import AppService from '@common/decorator/app_service.decorator';
import CoreService from '@common/core/core.service';
import Repository from '@common/core/repository';
import ContextService from '@common/core/context.service';
import PurchasedSubscriptionService from '@shared/purchased_subscription/purchased_subscription.service';

@AppService()
export default class MerchantService
   extends CoreService<Merchant>
   implements MerchantServiceMethods
{
   constructor(
      @Inject(REPOSITORY) protected readonly repository: Repository<Merchant>,
      private readonly purSubService: PurchasedSubscriptionService,
   ) {
      super();
   }

   tmpTst(): { data: string } {
      return { data: 'You hi me..' };
   }

   async merchantWithAuth({ id }: FindByIdDto) {
      const { data: merchant } = await this.findById({
         id,
         errorOnNotFound: true,
         populate: ['offlinePurchase'],
      });

      let isSubActive = merchant.offlinePurchase?.status?.status === EStatus.Active;
      if (!isSubActive && merchant.subscriptionPurchase) {
         const {
            data: { activePurchase },
         } = await this.purSubService.subMonitor({
            id: merchant._id,
            mail: merchant.mail,
         });
         isSubActive = activePurchase?.status?.status === EStatus.Active;
      }

      return { data: { merchant, isSubActive } };
   }

   // async loginUser({ id, userId, name, app }: MerchantUserLoginDto) {
   //    const {
   //       data: { merchant, isSubActive },
   //    } = await this.merchantWithAuth({ id, lean: true });
   //    const purchase = data.merchant.activePurchases[0];
   //    const loggedInUsers = data.merchant.loggedInUsers;
   //
   //    if (purchase?.type.type !== ESubscription.Offline) {
   //       const isSellerApp = app === EUserApp.Seller;
   //       const isAdminLoggedIn = loggedInUsers.some(({ app }) => app === EUserApp.Admin);
   //       const availableSlots = purchase.numUser - loggedInUsers.length;
   //       if (availableSlots <= 0 || (availableSlots === 1 && isSellerApp && !isAdminLoggedIn))
   //          throw new ForbiddenException('No Available slot to login');
   //    }
   //
   //    data.merchant.loggedInUsers.push({ app, userId, name });
   //    await data.merchant.save({ session: ContextService.get('session') });
   //    return { data };
   // }

   async createMerchant({ category, ...dto }: CreateMerchantDto) {
      const { data: type } = await ContextService.get('d_categoryService').getCategory(category);

      const merchant: Document<unknown, unknown, Merchant> & Merchant =
         await this.repository.custom(
            async (model) =>
               new model({
                  ...dto,
                  status: EStatus.Pending,
                  type,
               }),
         );

      return { data: await merchant.save({ session: ContextService.get('session') }) };
   }

   async requestVerification({ id }: FindByIdDto) {
      const { data } = await this.findById({ id });
      if (data.verified) throw new BadRequestException('Merchant already verified');
      const code = Math.floor(Math.random() * 1000000).toString();
      const { data: merchant } = await this.repository.findAndUpdate({
         id: data._id,
         update: { mfa: { code, expireAt: $dayjs().add(1, 'minutes').toDate() } },
      });
      return { data: merchant.mfa };
   }

   async verify({ id, code }: MerchantVerifyDto) {
      const { data: merchant } = await this.findById({ id });
      if (!merchant.mfa) throw new BadRequestException('Request verification code first');
      if ($dayjs().isAfter($dayjs(merchant.mfa.expireAt))) throw new BadRequestException('Expired');
      if (code !== merchant.mfa.code) throw new BadRequestException('Invalid code');
   }
}
