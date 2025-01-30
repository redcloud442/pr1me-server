import prisma from "../../utils/prisma.js";
export const userOptionsModel = async (params) => {
    const { page, limit } = params;
    const offset = (page - 1) * limit;
    const userData = await prisma.user_table.findMany({
        skip: offset,
        take: limit,
        select: {
            user_id: true,
            user_username: true,
        },
        where: {
            alliance_member_table: {
                some: {
                    alliance_member_user_id: { not: undefined },
                    alliance_member_role: { not: "ADMIN" },
                },
            },
        },
    });
    return userData;
};
export const merchantOptionsModel = async (params) => {
    const { page, limit } = params;
    const offset = (page - 1) * limit;
    const userData = await prisma.user_table.findMany({
        skip: offset,
        take: limit,
        select: {
            user_id: true,
            user_username: true,
        },
        where: {
            alliance_member_table: {
                some: {
                    alliance_member_user_id: { not: undefined },
                    alliance_member_role: "MERCHANT",
                },
            },
        },
    });
    return userData;
};
