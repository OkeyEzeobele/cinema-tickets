export default class TicketTypeRequest {
  static prices = {
    INFANT: 0,
    CHILD: 10,
    ADULT: 20
  };

  constructor({ infant = 0, child = 0, adult = 0 } = {}) {
    if (!Number.isInteger(infant) || !Number.isInteger(child) || !Number.isInteger(adult)) {
      throw new TypeError('infant, child, and adult must be an integer');
    }

    const ticketRequest = {
      get infant() {
        return infant;
      },
      get child() {
        return child;
      },
      get adult() {
        return adult;
      }
    };

    return Object.freeze(ticketRequest);
  }
}
