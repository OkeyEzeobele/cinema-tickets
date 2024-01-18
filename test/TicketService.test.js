import assert from "assert";
import sinon from "sinon";
import Logger from "../src/Logger.js";
import TicketService from "../src/pairtest/TicketService.js";
import InvalidPurchaseException from "../src/pairtest/lib/InvalidPurchaseException.js";
import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest.js";
import TicketPaymentService from "../src/thirdparty/paymentgateway/TicketPaymentService.js";
import SeatReservationService from "../src/thirdparty/seatbooking/SeatReservationService.js";

describe("TicketService", function () {
  let sandbox;
  let loggerStub;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    loggerStub = sandbox.stub(Logger.prototype, "error");
  });

  afterEach(function () {
    sandbox.restore();
  });
  describe("purchaseTickets", function () {
    it("should handle payment service errors", async function () {
      sandbox
        .stub(TicketPaymentService.prototype, "makePayment")
        .throws(new Error("Service Offline"));

      const ticketService = new TicketService();
      const accountId = 1;
      const ticketTypeRequest = new TicketTypeRequest({
        infant: 1,
        child: 1,
        adult: 1,
      });

      await assert.rejects(async () => {
        await ticketService.purchaseTickets(accountId, ticketTypeRequest);
      }, new InvalidPurchaseException("Payment service is currently offline. Please try again later."));
      sinon.assert.calledTwice(loggerStub);
    });

    it("should handle seat reservation service errors", async function () {
      sandbox
        .stub(SeatReservationService.prototype, "reserveSeat")
        .throws(new Error("Service Offline"));

      const ticketService = new TicketService();
      const accountId = 1;
      const ticketTypeRequest = new TicketTypeRequest({
        infant: 1,
        child: 1,
        adult: 1,
      });

      await assert.rejects(async () => {
        await ticketService.purchaseTickets(accountId, ticketTypeRequest);
      }, new InvalidPurchaseException("Seat reservation service is currently offline. Please try again later."));
      sinon.assert.calledTwice(loggerStub);
    });
    it("should return total amount and total seats for a valid ticket purchase", async function () {
      const ticketService = new TicketService();
      const accountId = 1;
      const ticketTypeRequest = new TicketTypeRequest({
        infant: 2,
        child: 3,
        adult: 2,
      });

      const result = await ticketService.purchaseTickets(
        accountId,
        ticketTypeRequest
      );

      assert.strictEqual(result.totalAmount, 70);
      assert.strictEqual(result.totalSeats, 5);
      sinon.assert.notCalled(loggerStub);
    });

    it("there should be a valid id", async function () {
      const ticketService = new TicketService();
      const accountId = "w";
      const ticketTypeRequest = new TicketTypeRequest({
        infant: 0,
        child: 0,
        adult: 20,
      });

      await assert.rejects(async () => {
        await ticketService.purchaseTickets(accountId, ticketTypeRequest);
      }, new InvalidPurchaseException("Invalid ticket id"));
      sinon.assert.calledOnce(loggerStub);
    });

    it("should throw an error for exceeding ticket limit", async function () {
      const ticketService = new TicketService();
      const accountId = 1;
      const ticketTypeRequest = new TicketTypeRequest({
        infant: 0,
        child: 0,
        adult: 21,
      });

      await assert.rejects(async () => {
        await ticketService.purchaseTickets(accountId, ticketTypeRequest);
      }, new InvalidPurchaseException("Total number of tickets exceeds the maximum limit of 20 tickets"));
      sinon.assert.calledOnce(loggerStub);
    });

    it("should throw an error for not purchasing at least one ticket", async function () {
      const ticketService = new TicketService();
      const accountId = 1;
      const ticketTypeRequest = new TicketTypeRequest({
        infant: 0,
        child: 0,
        adult: 0,
      });

      await assert.rejects(async () => {
        await ticketService.purchaseTickets(accountId, ticketTypeRequest);
      }, new InvalidPurchaseException("At least one ticket must be purchased"));
      sinon.assert.calledOnce(loggerStub);
    });

    it("should throw an error for not purchasing an adult ticket", async function () {
      const ticketService = new TicketService();
      const accountId = 1;
      const ticketTypeRequest = new TicketTypeRequest({
        infant: 0,
        child: 1,
        adult: 0,
      });

      await assert.rejects(async () => {
        await ticketService.purchaseTickets(accountId, ticketTypeRequest);
      }, new InvalidPurchaseException("At least one adult ticket must be purchased"));
      sinon.assert.calledOnce(loggerStub);
    });

    it("should throw an error for purchasing more infant tickets than adult tickets", async function () {
      const ticketService = new TicketService();
      const accountId = 1;
      const ticketTypeRequest = new TicketTypeRequest({
        infant: 4,
        child: 1,
        adult: 3,
      });

      await assert.rejects(async () => {
        await ticketService.purchaseTickets(accountId, ticketTypeRequest);
      }, new InvalidPurchaseException("Number of infant tickets must not exceed number of adult tickets"));
      sinon.assert.calledOnce(loggerStub);
    });
  });
});
