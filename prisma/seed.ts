import { PrismaClient, Role, TourStatus, VendorApprovalStatus, BookingStatus } from '@prisma/client';
import { hash } from 'argon2';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.vendorResponse.deleteMany();
  await prisma.review.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bookingStatusHistory.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.tourAvailability.deleteMany();
  await prisma.tourSchedule.deleteMany();
  await prisma.tourMedia.deleteMany();
  await prisma.tour.deleteMany();
  await prisma.vendorProfile.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.contactSubmission.deleteMany();
  await prisma.contentPage.deleteMany();
  await prisma.fAQ.deleteMany();
  await prisma.appSetting.deleteMany();
  await prisma.user.deleteMany();

  const password = await hash('Password123!');

  await prisma.user.create({
    data: {
      email: 'admin@tourdevino.local',
      passwordHash: password,
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN
    }
  });

  const vendorUser = await prisma.user.create({
    data: {
      email: 'vendor@tourdevino.local',
      passwordHash: password,
      firstName: 'Vera',
      lastName: 'Vendor',
      role: Role.VENDOR,
      vendorProfile: {
        create: {
          companyName: 'Vino Trails Ltd',
          approvalStatus: VendorApprovalStatus.APPROVED
        }
      }
    }
  });

  const vendorPending = await prisma.user.create({
    data: {
      email: 'vendor-pending@tourdevino.local',
      passwordHash: password,
      firstName: 'Penny',
      lastName: 'Pending',
      role: Role.VENDOR,
      vendorProfile: {
        create: {
          companyName: 'Pending Vines LLC',
          approvalStatus: VendorApprovalStatus.PENDING
        }
      }
    }
  });

  const secondVendor = await prisma.user.create({
    data: {
      email: 'vendor-two@tourdevino.local',
      passwordHash: password,
      firstName: 'Victor',
      lastName: 'Second',
      role: Role.VENDOR,
      vendorProfile: {
        create: {
          companyName: 'Second Estate Tours',
          approvalStatus: VendorApprovalStatus.APPROVED
        }
      }
    }
  });

  const client = await prisma.user.create({
    data: {
      email: 'client@tourdevino.local',
      passwordHash: password,
      firstName: 'Cora',
      lastName: 'Client',
      role: Role.CLIENT
    }
  });

  const tours = await prisma.$transaction([
    prisma.tour.create({
      data: {
        vendorId: vendorUser.id,
        slug: 'tokaj-aszu-cellars',
        title: 'Tokaj Aszu Cellar Trail',
        description:
          'Explore Tokaj-Hegyalja cellars, dry Furmint tastings, and late-harvest Tokaji traditions in historic villages.',
        region: 'Tokaj',
        priceCents: 18900,
        durationHours: 5,
        latitude: 48.15,
        longitude: 21.35,
        status: TourStatus.ACTIVE
      }
    }),
    prisma.tour.create({
      data: {
        vendorId: vendorUser.id,
        slug: 'eger-bikaver-heritage',
        title: 'Eger Bikaver Heritage Walk',
        description:
          "Discover Eger's red blend legacy with guided tastings of Egri Bikaver and hilltop vineyard viewpoints.",
        region: 'Eger',
        priceCents: 14900,
        durationHours: 4,
        latitude: 47.899,
        longitude: 20.3747,
        status: TourStatus.ACTIVE
      }
    }),
    prisma.tour.create({
      data: {
        vendorId: secondVendor.id,
        slug: 'villany-cabernet-ridge',
        title: 'Villany Cabernet Ridge Day',
        description:
          'Full-bodied southern reds, cellar tastings, and vineyard stops in Hungarys warmest red wine region.',
        region: 'Villany',
        priceCents: 17900,
        durationHours: 6,
        latitude: 45.8695,
        longitude: 18.4556,
        status: TourStatus.ACTIVE
      }
    }),
    prisma.tour.create({
      data: {
        vendorId: vendorUser.id,
        slug: 'badacsony-volcanic-whites',
        title: 'Badacsony Volcanic Whites',
        description:
          'Lake Balaton north shore route focused on volcanic terroir, Olaszrizling, and mineral-driven white wines.',
        region: 'Badacsony',
        priceCents: 16900,
        durationHours: 8,
        latitude: 46.8035,
        longitude: 17.4958,
        status: TourStatus.ACTIVE
      }
    }),
    prisma.tour.create({
      data: {
        vendorId: secondVendor.id,
        slug: 'szekszard-kadarka-estates',
        title: 'Szekszard Kadarka Estates',
        description:
          'Spice-forward reds from Szekszard including Kadarka and Kekfrankos with local food pairings.',
        region: 'Szekszard',
        priceCents: 15900,
        durationHours: 5,
        latitude: 46.356,
        longitude: 18.7038,
        status: TourStatus.ACTIVE
      }
    }),
    prisma.tour.create({
      data: {
        vendorId: vendorUser.id,
        slug: 'sopron-kekfrankos-routes',
        title: 'Sopron Kekfrankos Routes',
        description:
          'Borderland vineyards around Sopron focused on elegant Kekfrankos and cool-climate red styles.',
        region: 'Sopron',
        priceCents: 15400,
        durationHours: 5,
        latitude: 47.6817,
        longitude: 16.5845,
        status: TourStatus.ACTIVE
      }
    }),
    prisma.tour.create({
      data: {
        vendorId: secondVendor.id,
        slug: 'pannonhalma-benedictine-vines',
        title: 'Pannonhalma Benedictine Vines',
        description:
          'Monastery hills and modern cellars in Pannonhalma, with aromatic whites and sparkling selections.',
        region: 'Pannonhalma',
        priceCents: 16200,
        durationHours: 5,
        latitude: 47.5495,
        longitude: 17.7554,
        status: TourStatus.ACTIVE
      }
    }),
    prisma.tour.create({
      data: {
        vendorId: vendorUser.id,
        slug: 'balatonfured-csopak-whites',
        title: 'Balatonfured Csopak Whites',
        description:
          'Lakeside terraces around Balatonfured and Csopak with crisp Olaszrizling and food pairing stops.',
        region: 'Balatonfured-Csopak',
        priceCents: 15800,
        durationHours: 4,
        latitude: 46.9545,
        longitude: 17.8898,
        status: TourStatus.ACTIVE
      }
    }),
    prisma.tour.create({
      data: {
        vendorId: secondVendor.id,
        slug: 'somlo-volcanic-minerals',
        title: 'Somlo Volcanic Minerals',
        description:
          'Steep volcanic slopes of Somlo with structured whites and small-estate barrel tastings.',
        region: 'Somlo',
        priceCents: 17100,
        durationHours: 6,
        latitude: 47.1619,
        longitude: 17.3716,
        status: TourStatus.ACTIVE
      }
    }),
    prisma.tour.create({
      data: {
        vendorId: vendorUser.id,
        slug: 'matra-highland-cellars',
        title: 'Matra Highland Cellars',
        description:
          'High-elevation vineyards in Matra featuring fresh whites and lighter reds from volcanic foothills.',
        region: 'Matra',
        priceCents: 14600,
        durationHours: 4,
        latitude: 47.902,
        longitude: 20.0576,
        status: TourStatus.ACTIVE
      }
    })
  ]);

  const tourBySlug = Object.fromEntries(tours.map((tour) => [tour.slug, tour]));

  for (const [index, tour] of tours.entries()) {
    await prisma.tourMedia.createMany({
      data: [
        {
          tourId: tour.id,
          type: 'image',
          url: `https://images.tourdevino.local/${tour.slug}/hero.jpg`,
          sortOrder: 0
        },
        {
          tourId: tour.id,
          type: 'image',
          url: `https://images.tourdevino.local/${tour.slug}/cellar.jpg`,
          sortOrder: 1
        }
      ]
    });

    for (let dayOffset = 1; dayOffset <= 6; dayOffset += 1) {
      const date = new Date();
      date.setDate(date.getDate() + dayOffset + index);
      date.setHours(9, 0, 0, 0);

      await prisma.tourSchedule.create({
        data: {
          tourId: tour.id,
          startsAt: date
        }
      });

      await prisma.tourAvailability.create({
        data: {
          tourId: tour.id,
          date: new Date(date.toISOString().slice(0, 10)),
          capacity: 20,
          bookedCount: index === 0 && dayOffset === 1 ? 2 : 0
        }
      });
    }
  }

  const sampleBooking = await prisma.booking.create({
    data: {
      userId: client.id,
      tourId: tourBySlug['tokaj-aszu-cellars'].id,
      scheduledAt: new Date(new Date().setDate(new Date().getDate() + 2)),
      guestCount: 2,
      status: BookingStatus.COMPLETED,
      totalCents: 31800
    }
  });

  await prisma.booking.create({
    data: {
      userId: client.id,
      tourId: tourBySlug['szekszard-kadarka-estates'].id,
      scheduledAt: new Date(new Date().setDate(new Date().getDate() + 5)),
      guestCount: 1,
      status: BookingStatus.COMPLETED,
      totalCents: 15900
    }
  });

  await prisma.booking.create({
    data: {
      userId: client.id,
      tourId: tourBySlug['eger-bikaver-heritage'].id,
      scheduledAt: new Date(new Date().setHours(new Date().getHours() + 8)),
      guestCount: 1,
      status: BookingStatus.PAID,
      totalCents: 12900
    }
  });

  await prisma.review.createMany({
    data: [
      {
        userId: client.id,
        tourId: tourBySlug['tokaj-aszu-cellars'].id,
        bookingId: sampleBooking.id,
        rating: 5,
        comment: 'Great cellar visit and excellent Tokaji tasting lineup.'
      },
      {
        userId: client.id,
        tourId: tourBySlug['eger-bikaver-heritage'].id,
        rating: 4,
        comment: 'Very good guide and authentic Eger wine cellars.'
      }
    ]
  });

  await prisma.contentPage.createMany({
    data: [
      {
        slug: 'about',
        title: 'About Tour de Vino',
        body: 'Tour de Vino curates premium wine experiences from trusted local operators.'
      },
      {
        slug: 'terms',
        title: 'Terms and Conditions',
        body: 'Booking terms, cancellation windows, and service policies are listed here.'
      }
    ]
  });

  await prisma.fAQ.createMany({
    data: [
      {
        question: 'How do I find tours near me?',
        answer: 'Use the Search or Map pages and narrow by region, price, and rating.',
        sortOrder: 1
      },
      {
        question: 'Can I cancel a booking?',
        answer: 'Yes. Cancellation eligibility depends on the selected tour policy.',
        sortOrder: 2
      }
    ]
  });

  await prisma.appSetting.create({
    data: {
      key: 'platform',
      value: {
        supportEmail: 'support@tourdevino.local',
        bookingCancellationWindowHours: 24,
        webhookProvider: 'stripe'
      }
    }
  });

  console.log('Seed complete. Accounts: admin/vendor/vendor-pending/vendor-two/client');
}

main()
  .catch(async (error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
