import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CustomerPortal from "./CustomerPortal";

vi.mock("../services/api", () => ({
  createPublicRequest: vi.fn(),
  getPublicRequest: vi.fn()
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
});
