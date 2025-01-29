import type { alliance_member_table } from "@prisma/client";
import { type DepositFormValues } from "../../schema/schema.js";
import prisma from "../../utils/prisma.js";
import { supabaseClient } from "../../utils/supabase.js";

export const depositPostModel = async (params: {
  TopUpFormValues: DepositFormValues;
  publicUrl: string;
  teamMemberProfile: alliance_member_table;
}) => {
  const { amount, accountName, accountNumber } = params.TopUpFormValues;

  const { publicUrl } = params;

  if (amount.length > 7 || amount.length < 3) {
    throw new Error("Invalid amount");
  }

  const merchantData = await prisma.merchant_table.findFirst({
    where: {
      merchant_account_name: accountName,
      merchant_account_number: accountNumber,
    },
    select: {
      merchant_account_name: true,
      merchant_account_number: true,
      merchant_account_type: true,
    },
  });

  if (!merchantData) {
    throw new Error("Invalid account name or number");
  }

  if (!merchantData) {
    throw new Error("Invalid account name or number");
  }

  await prisma.$transaction(async (tx) => {
    await tx.alliance_top_up_request_table.create({
      data: {
        alliance_top_up_request_amount: Number(amount),
        alliance_top_up_request_type: merchantData.merchant_account_type,
        alliance_top_up_request_name: accountName,
        alliance_top_up_request_account: accountNumber,
        alliance_top_up_request_attachment: publicUrl,
        alliance_top_up_request_member_id:
          params.teamMemberProfile.alliance_member_id,
      },
    });
    await tx.alliance_transaction_table.create({
      data: {
        transaction_amount: Number(amount),
        transaction_description: "Deposit Pending",
        transaction_details: `Account Name: ${accountName} | Account Number: ${accountNumber}`,
        transaction_member_id: params.teamMemberProfile.alliance_member_id,
      },
    });
  });
};

export const depositPutModel = async (params: {
  status: string;
  note: string;
  requestId: string;
  teamMemberProfile: alliance_member_table;
}) => {
  const { status, note, requestId, teamMemberProfile } = params;

  const merchant = await prisma.merchant_member_table.findFirst({
    where: {
      merchant_member_merchant_id: teamMemberProfile.alliance_member_id,
    },
  });

  if (!merchant && teamMemberProfile.alliance_member_role === "MERCHANT")
    throw new Error("Merchant not found.");

  return await prisma.$transaction(async (tx) => {
    const existingRequest = await tx.alliance_top_up_request_table.findUnique({
      where: {
        alliance_top_up_request_id: requestId,
      },
    });

    if (!existingRequest) {
      throw new Error("Request not found.");
    }

    const updatedRequest = await tx.alliance_top_up_request_table.update({
      where: { alliance_top_up_request_id: requestId },
      data: {
        alliance_top_up_request_status: status,
        alliance_top_up_request_approved_by:
          teamMemberProfile.alliance_member_id,
        alliance_top_up_request_reject_note: note ?? null,
      },
    });

    await tx.alliance_transaction_table.create({
      data: {
        transaction_description: `Deposit ${
          status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
        } ${note ? `(${note})` : ""}`,
        transaction_details: `Account Name: ${updatedRequest.alliance_top_up_request_name}, Account Number: ${updatedRequest.alliance_top_up_request_account}`,
        transaction_amount: updatedRequest.alliance_top_up_request_amount,
        transaction_member_id: updatedRequest.alliance_top_up_request_member_id,
      },
    });

    if (status === "APPROVED") {
      const updatedEarnings = await tx.alliance_earnings_table.upsert({
        where: {
          alliance_earnings_member_id:
            updatedRequest.alliance_top_up_request_member_id,
        },
        create: {
          alliance_earnings_member_id:
            updatedRequest.alliance_top_up_request_member_id,
          alliance_olympus_wallet:
            updatedRequest.alliance_top_up_request_amount,
          alliance_combined_earnings:
            updatedRequest.alliance_top_up_request_amount,
        },
        update: {
          alliance_olympus_wallet: {
            increment: updatedRequest.alliance_top_up_request_amount,
          },
          alliance_combined_earnings: {
            increment: updatedRequest.alliance_top_up_request_amount,
          },
        },
      });

      // Balance validation and update
      if (
        merchant &&
        status === "APPROVED" &&
        merchant.merchant_member_balance >=
          updatedRequest.alliance_top_up_request_amount
      ) {
        const updatedMerchant = await tx.merchant_member_table.update({
          where: { merchant_member_id: merchant.merchant_member_id },
          data: {
            merchant_member_balance: {
              decrement: updatedRequest.alliance_top_up_request_amount,
            },
          },
        });

        return {
          updatedRequest,
          updatedEarnings,
          updatedMerchant,
        };
      } else {
        throw new Error(
          "Insufficient balance. Cannot proceed with the update."
        );
      }
    } else {
      return { updatedRequest };
    }
  });
};

export const depositHistoryPostModel = async (params: {
  search: string;
  page: string;
  limit: string;
  sortBy: string;
  columnAccessor: string;
  isAscendingSort: string;
  teamMemberId: string;
  userId: string;
  teamMemberProfile: alliance_member_table;
}) => {
  const {
    search,
    page,
    sortBy,
    limit,
    columnAccessor,
    isAscendingSort,

    userId,
    teamMemberProfile,
  } = params;

  const input_data = {
    search,
    page,
    limit,
    sortBy,
    columnAccessor,
    isAscendingSort: isAscendingSort,
    teamId: teamMemberProfile?.alliance_member_alliance_id || "",
    userId: userId ? userId : teamMemberProfile?.alliance_member_id,
  };

  const { data, error } = await supabaseClient.rpc(
    "get_member_top_up_history",
    {
      input_data: input_data,
    }
  );

  if (error) throw error;

  return data;
};
