import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CustomerPortal from "./CustomerPortal";

vi.mock("../services/api", () => ({
  createPublicRequest: vi.fn(),
  getPublicRequest: vi.fn(),
  warmUpApi: vi.fn().mockResolvedValue(true)
}));

vi.mock("../imageUtils", () => ({
  compressImageFile: vi.fn()
}));

describe("CustomerPortal", () => {
  it("talep oluşturma ve takip görevlerini ayrı ekranlarda gösterir", async () => {
    const user = userEvent.setup();
    render(<CustomerPortal />);

    expect(screen.getByRole("heading", { name: "Arıza Talebi Aç" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Takip Kodu")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Talep Takibi" }));

    expect(screen.getByRole("heading", { name: "Talebini Takip Et" })).toBeInTheDocument();
    expect(screen.getByLabelText("Takip Kodu")).toBeInTheDocument();
    expect(screen.queryByLabelText("Ad Soyad")).not.toBeInTheDocument();
  });

  it("takip sonucunda durum geçmişini gösterir", async () => {
    const { getPublicRequest } = await import("../services/api");
    getPublicRequest.mockResolvedValue({
      data: {
        requestCode: "SD-100001",
        productCategoryLabel: "Kombi / Isıtma",
        status: "in_progress",
        appointmentAt: null,
        photos: [],
        statusHistory: [
          {
            id: "evt-1",
            status: "pending",
            actor: "customer",
            createdAt: "2026-09-07T10:00:00.000Z"
          },
          {
            id: "evt-2",
            status: "in_progress",
            actor: "technician",
            createdAt: "2026-09-07T12:00:00.000Z"
          }
        ]
      }
    });

    const user = userEvent.setup();
    render(<CustomerPortal />);
    await user.click(screen.getByRole("tab", { name: "Talep Takibi" }));
    await user.type(screen.getByLabelText("Takip Kodu"), "SD-100001");
    await user.type(screen.getByLabelText("Telefon"), "5551112233");
    await user.click(screen.getByRole("button", { name: /Durumu Göster/i }));

    expect(await screen.findByText("Talep geçmişi")).toBeInTheDocument();
    expect(screen.getByText("Talep alındı")).toBeInTheDocument();
    expect(screen.getByText("İncelemede")).toBeInTheDocument();
  });
});
