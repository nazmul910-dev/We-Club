import type { NextFunction, Request, Response } from "express";

import assertFound from "../../utility/assertFound";
import sendResponse from "../../utility/sendResponse";
import { supportTicketService } from "./support.ticket.service";

const auth = (req: Request) => { assertFound(req.user, "Authentication required", 401); return req.user; };
const admins = ["founder", "super_admin", "admin", "manager"];

const create = async (req: Request, res: Response, next: NextFunction) => { 
    try { 
      const user = auth(req);
      const data = await supportTicketService.create(user.id, req.body); 
      sendResponse(res, { 
        statusCode: 201, 
        success: true, 
        message: "Support ticket created successfully", 
        data 
      }); 
    } catch (error) {
       next(error); 
      }}

const mine = async (req: Request, res: Response, next: NextFunction) =>{ 
    try { 
      const user = auth(req); 
      const data = await supportTicketService.myTickets(user.id, req.query as never); 
      sendResponse(res, { 
        statusCode: 200, 
        success: true, 
        message: "Support tickets retrieved successfully", 
        data }); 
      } catch (error) { 
        next(error); 
      }}

const adminList =    async (req: Request, res: Response, next: NextFunction) => { 
    try { 
      auth(req); 
      const data = await supportTicketService.adminList(req.query as never); 
      sendResponse(res, 
        { 
          statusCode: 200, 
          success: true, 
          message: "Support tickets retrieved successfully", 
          data 
        }); 
      } catch (error) { 
        next(error); 
      }}

const getById =  async (req: Request, res: Response, next: NextFunction) => { 
    try { 
      const user = auth(req); 
      const data = await supportTicketService.getById(String(req.params.id), user.id, admins.includes(user.role)); 
      sendResponse(res, { 
        statusCode: 200, 
        success: true, 
        message: "Support ticket retrieved successfully", 
        data }); 
      } catch (error) { 
          next(error); 
        }}     
const update = async (req: Request, res: Response, next: NextFunction) => { 
    try { 
      const user = auth(req); 
      const data = await supportTicketService.update(String(req.params.id), user.id, req.body); 
      sendResponse(res, { 
        statusCode: 200, 
        success: true, 
        message: "Support ticket updated successfully", 
        data }); 
      } catch (error) { 
        next(error); 
      }};

export const supportTicketController = {
  create,mine,adminList,getById,update,

};
