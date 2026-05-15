import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { TeamMember } from './team.model';

export const getTeamMembers = async (req: Request, res: Response) => {
  try {
    const members = await TeamMember.find();
    res.status(StatusCodes.OK).json({ success: true, data: members });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Error fetching team members' });
  }
};

export const createTeamMember = async (req: Request, res: Response) => {
  try {
    const member = await TeamMember.create(req.body);
    res.status(StatusCodes.CREATED).json({ success: true, data: member });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: error.message });
  }
};

export const updateTeamMember = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const member = await TeamMember.findOneAndUpdate({ email }, req.body, { new: true });
    if (!member) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Member not found' });
    }
    res.status(StatusCodes.OK).json({ success: true, data: member });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: error.message });
  }
};

export const deleteTeamMember = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const member = await TeamMember.findOneAndDelete({ email });
    if (!member) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Member not found' });
    }
    res.status(StatusCodes.OK).json({ success: true, message: 'Member deleted successfully' });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};
