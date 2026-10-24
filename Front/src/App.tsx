import { MotionConfig } from "framer-motion";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      {/* startTransition: al navegar a una ruta perezosa se mantiene la página actual hasta que la nueva está lista. */}
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </MotionConfig>
  );
}
