import TicketTypeRequest from "./lib/TicketTypeRequest.js";
import InvalidPurchaseException from "./lib/InvalidPurchaseException.js";
import TicketPaymentService from "../thirdparty/paymentgateway/TicketPaymentService.js";
import SeatReservationService from "../thirdparty/seatbooking/SeatReservationService.js";
import Logger from "../Logger.js";

const logger = new Logger();

export default class TicketService {
  static MAX_TICKETS = 20;

  async purchaseTickets(accountId, ...ticketTypeRequests) {
    try {
      let totalAmount = 0;
      let totalSeats = 0;

      //validate accountId
      this._validateId(accountId);

      // Validate each ticketTypeRequest and calculate total amount and total seats
      for (const ticketTypeRequest of ticketTypeRequests) {
        this._validateRequest(ticketTypeRequest);
        const { amount, seats } =
          this._calculatePaymentAndSeats(ticketTypeRequest);
        totalAmount += amount;
        totalSeats += seats;
      }

      // Make a payment request
      try {
        const payForTicket = new TicketPaymentService();
        payForTicket.makePayment(accountId, totalAmount);
      } catch (paymentError) {
        logger.error(`Payment Error: ${paymentError.message}`);
        if (paymentError.message.includes("Service Offline")) {
          throw new InvalidPurchaseException(
            "Payment service is currently offline. Please try again later."
          );
        } else {
          throw new InvalidPurchaseException(
            "An error occured, please try again"
          );
        }
      }

      // Make a seat reservation request
      try {
        const reserveSeat = new SeatReservationService();
        reserveSeat.reserveSeat(accountId, totalSeats);
      } catch (reservationError) {
        logger.error(`Reservation Error: ${reservationError.message}`);
        if (reservationError.message.includes("Service Offline")) {
          throw new InvalidPurchaseException(
            "Seat reservation service is currently offline. Please try again later."
          );
        } else {
          throw new InvalidPurchaseException(
            "An error occured, please try again"
          );
        }
      }

      return { totalAmount, totalSeats };
    } catch (e) {
      logger.error(e)
      throw new InvalidPurchaseException(e.message || "An Error Occurred");
    }
  }

  _validateRequest(ticketTypeRequest) {
    const numInfantTickets = ticketTypeRequest.infant;
    const numChildTickets = ticketTypeRequest.child;
    const numAdultTickets = ticketTypeRequest.adult;
    const totalTickets = numInfantTickets + numChildTickets + numAdultTickets;

    if (totalTickets > TicketService.MAX_TICKETS) {
      throw new InvalidPurchaseException(
        "Total number of tickets exceeds the maximum limit of 20 tickets"
      );
    }

    if (totalTickets <= 0) {
      throw new InvalidPurchaseException(
        "At least one ticket must be purchased"
      );
    } else if (numAdultTickets <= 0) {
      throw new InvalidPurchaseException(
        "At least one adult ticket must be purchased"
      );
    }

    if (numInfantTickets > numAdultTickets) {
      throw new InvalidPurchaseException(
        "Number of infant tickets must not exceed number of adult tickets"
      );
    }
  }

  _calculatePaymentAndSeats(ticketTypeRequest) {
    const numChildTickets = ticketTypeRequest.child;
    const numAdultTickets = ticketTypeRequest.adult;

    const amount =
      numChildTickets * TicketTypeRequest.prices.CHILD +
      numAdultTickets * TicketTypeRequest.prices.ADULT;
    const seats = numChildTickets + numAdultTickets;

    return { amount, seats };
  }

  _validateId(id) {
    if (!Number.isInteger(id)||id < 0) {
      throw new InvalidPurchaseException("Invalid ticket id");
    }
  }
}
