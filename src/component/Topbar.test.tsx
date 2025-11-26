
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import TopBar from "./Topbar";
import { notificationApi } from "@/lib/api/skybase";
import { Notification } from "@/types/api";

jest.mock("@/lib/api/skybase", () => ({
  notificationApi: {
    getRecent: jest.fn(),
  },
}));

const mockNotifications: Notification[] = [
  {
    notification_id: 1,
    message: "Test notification 1",
    type: "info",
    created_at: new Date().toISOString(),
    is_broadcast: false,
    time_ago: "5 minutes ago",
    related_id: null,
    related_type: null,
  },
  {
    notification_id: 2,
    message: "Test notification 2",
    type: "warning",
    created_at: new Date().toISOString(),
    is_broadcast: false,
    time_ago: "10 minutes ago",
    related_id: null,
    related_type: null,
  },
];

describe("TopBar", () => {
  it("should open popover on notification bell click", async () => {
    (notificationApi.getRecent as jest.Mock).mockResolvedValue({
      data: mockNotifications,
    });

    const { getByLabelText, getByText } = render(<TopBar />);

    const notificationButton = getByLabelText("Notifications");
    fireEvent.click(notificationButton);

    await waitFor(() => {
      expect(getByText("Notifikasi")).toBeInTheDocument();
      expect(getByText("Test notification 1")).toBeInTheDocument();
      expect(getByText("Test notification 2")).toBeInTheDocument();
      expect(getByText("Lihat Semua")).toBeInTheDocument();
    });
  });
});
