import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthScreen from "./AuthScreen";
import { login, register, warmUpApi } from "../services/api";

vi.mock("../services/api", () => ({
  login: vi.fn(),
  register: vi.fn(),
  warmUpApi: vi.fn()
}));

vi.mock("./CustomerPortal", () => ({ default: () => <div>Müşteri portalı</div> }));
vi.mock("./InstallAppButton", () => ({ default: () => null }));

describe("AuthScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/?entry=technician");
    warmUpApi.mockResolvedValue(undefined);
  });

  it("Enter tuşuyla normalize edilmiş bilgilerle giriş yapar", async () => {
    const user = userEvent.setup();
    const onAuthSuccess = vi.fn();
    const authenticatedUser = { id: "usta-1", name: "İzzet Usta" };
    login.mockResolvedValue({ data: { user: authenticatedUser } });

    render(<AuthScreen onAuthSuccess={onAuthSuccess} />);

    await user.type(screen.getByLabelText("E-posta"), "  USTA@ORNEK.COM  ");
    await user.type(screen.getByLabelText("Şifre"), "guclu-sifre{Enter}");

    await waitFor(() => {
      expect(login).toHaveBeenCalledOnce();
    });
    expect(login).toHaveBeenCalledWith({
      email: "usta@ornek.com",
      password: "guclu-sifre"
    });
    expect(onAuthSuccess).toHaveBeenCalledWith(authenticatedUser);
  });

  it("kayıt adından rakamları temizler", async () => {
    const user = userEvent.setup();

    render(<AuthScreen onAuthSuccess={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /kayıt ol/i }));

    const nameInput = screen.getByLabelText("Ad Soyad");
    await user.type(nameInput, "İzzet123 Erdoğan45");

    expect(nameInput).toHaveValue("İzzet Erdoğan");
    expect(register).not.toHaveBeenCalled();
  });

  it("sunucudan gelen hatalı şifre mesajını Türkçe gösterir", async () => {
    const user = userEvent.setup();
    login.mockRejectedValue(new Error("Invalid email or password."));

    render(<AuthScreen onAuthSuccess={vi.fn()} />);
    await user.type(screen.getByLabelText("E-posta"), "usta@ornek.com");
    await user.type(screen.getByLabelText("Şifre"), "yanlis-sifre{Enter}");

    expect(await screen.findByRole("status")).toHaveTextContent("E-posta veya şifre hatalı.");
  });
});
