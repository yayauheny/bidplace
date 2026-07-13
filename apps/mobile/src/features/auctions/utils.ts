import type { Auction, Bid } from '@bidplace/contracts';

export function getAuctionStatusLabel(status: Auction['status']) {
  switch (status) {
    case 'draft':
      return 'Черновик';
    case 'scheduled':
      return 'Скоро старт';
    case 'active':
      return 'Идет торг';
    case 'ended':
      return 'Завершен';
    case 'sold':
      return 'Продан';
    case 'cancelled':
      return 'Отменен';
    case 'failed':
      return 'Не состоялся';
    case 'hidden':
      return 'Скрыт';
    default:
      return status;
  }
}

export function getAuctionStatusTone(status: Auction['status']) {
  switch (status) {
    case 'active':
      return 'success';
    case 'scheduled':
      return 'accent';
    case 'sold':
      return 'success';
    case 'failed':
    case 'cancelled':
    case 'hidden':
      return 'danger';
    case 'ended':
      return 'warning';
    default:
      return 'neutral';
  }
}

export function getBidStatusLabel(status: Bid['status']) {
  switch (status) {
    case 'winning':
      return 'Ведущая';
    case 'won':
      return 'Победа';
    case 'outbid':
      return 'Перебита';
    case 'lost':
      return 'Проиграла';
    case 'active':
      return 'Активна';
    case 'cancelled':
      return 'Отменена';
    case 'invalid':
      return 'Недействительна';
    default:
      return status;
  }
}

export function getBidStatusTone(status: Bid['status']) {
  switch (status) {
    case 'winning':
    case 'won':
      return 'success';
    case 'outbid':
      return 'warning';
    case 'lost':
    case 'cancelled':
    case 'invalid':
      return 'danger';
    default:
      return 'neutral';
  }
}
