import { Button } from "@/components/ui/button";

export default function Home() {
  return (

    <div className="flex flex-col">
      <div className="bg-slate-300 text-white text-center py-4">Shadcn.ui</div>


      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 bg-slate-200 text-white text-center py-4">
          
          <Button>Click me</Button> 
        </div>
        <div className="w-full md:w-1/2 bg-slate-400 text-center py-4">
          <h1 className="text-3xl font-bold underline">Hello world!</h1>
        </div>
      </div>
    </div>
  );
}
