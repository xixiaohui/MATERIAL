import { Button } from "@/components/ui/button";
// import { MenubarDemo } from "@/components/MenubarDemo";
import { NavigationMenuDemo } from "@/components/NavigationMenuDemo";

export default function Home() {
  return (

    <div className="flex flex-col">
      <div className="flex justify-center py-4">
        
        <NavigationMenuDemo />
      
        
      </div>


      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 text-center py-4">
          
          <Button>Click me</Button> 
        </div>
        <div className="w-full md:w-1/2 text-center py-4">
          
        </div>
      </div>
    </div>
  );
}
