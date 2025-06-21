import { Button } from "@/components/ui/button";
import { Coffee } from "lucide-react";

const CustomButton = () => {
  return (
    <div>
      <div className="bg-blue-500 text-white text-center p-4">
        Tailwind CSS 已成功安装！
      </div>

      <Button variant="outline">
        Click Me
      </Button>

      <Coffee size={48} color="brown" />
    </div>
  );
};

export default CustomButton;
